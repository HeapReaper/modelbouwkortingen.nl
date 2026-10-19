// Package fetch bevat de HTTP client van de crawler: per host een rate limit,
// robots.txt-controle en exponentiële backoff bij HTTP 429.
//
// Omdat elke host zijn eigen wachtrij/backoff heeft, blokkeert een 429 van shop A
// alleen de workers van shop A; de andere shops worden ondertussen gewoon gecrawld.
package fetch

import (
	"cmp"
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
)

var (
	ErrRobots   = errors.New("geblokkeerd door robots.txt")
	ErrNotFound = errors.New("pagina niet gevonden")
)

const (
	maxBodySize  = 64 << 20 // 64 MB: de sitemap van Berlinski is al ~45 MB
	maxHostDelay = 15 * time.Second
)

type Options struct {
	UserAgent  string
	HostDelay  time.Duration
	Timeout    time.Duration
	MaxRetries int
	Backoff429 time.Duration
	MaxBackoff time.Duration
}

type Fetcher struct {
	opts   Options
	client *http.Client
	stats  *stats.Registry
	log    *slog.Logger

	mu    sync.Mutex
	hosts map[string]*host
}

type host struct {
	mu           sync.Mutex
	next         time.Time     // vroegste moment voor het volgende request
	delay        time.Duration // huidige tijd tussen requests (groeit na een 429)
	backoff      time.Duration // huidige 429-wachttijd: 5s, 10s, 20s, ...
	blockedUntil time.Time
	okStreak     int // aantal succesvolle requests sinds de laatste 429

	robotsOnce sync.Once
	robots     *Robots
	minDelay   time.Duration // Crawl-delay uit robots.txt of SetHostPolicy
	userAgent  string        // afwijkende user-agent voor deze host ("" = standaard)
	cookie     string        // vaste Cookie-header voor deze host ("" = geen)
}

type Response struct {
	URL        string // uiteindelijke URL na redirects
	StatusCode int
	Body       []byte
	Header     http.Header
}

func New(opts Options, st *stats.Registry, log *slog.Logger) *Fetcher {
	transport := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 15 * time.Second, KeepAlive: 30 * time.Second}).DialContext,
		MaxIdleConnsPerHost:   8,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   15 * time.Second,
		ResponseHeaderTimeout: opts.Timeout,
		ForceAttemptHTTP2:     true,
		DisableCompression:    true, // we vragen zelf gzip aan en pakken het zelf uit
	}
	f := &Fetcher{
		opts:  opts,
		stats: st,
		log:   log,
		hosts: map[string]*host{},
	}
	f.client = &http.Client{
		Transport: transport,
		Timeout:   opts.Timeout,
		// Ook redirects moeten aan robots.txt voldoen (bv. doorverwijzing naar /customer/login).
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 5 {
				return errors.New("te veel redirects")
			}
			if req.URL.Path == "/robots.txt" {
				return nil
			}
			if !f.Allowed(req.Context(), req.URL.String()) {
				return ErrRobots
			}
			return nil
		},
	}
	return f
}

func (f *Fetcher) host(h string) *host {
	f.mu.Lock()
	defer f.mu.Unlock()
	hs, ok := f.hosts[h]
	if !ok {
		hs = &host{}
		f.hosts[h] = hs
	}
	return hs
}

// SetHostPolicy geeft één host een eigen user-agent (leeg = standaard) en een minimale
// tijd tussen requests (bovenop HostDelay en een eventuele Crawl-delay).
func (f *Fetcher) SetHostPolicy(hostName, userAgent string, minDelay time.Duration) {
	hs := f.host(hostName)
	hs.mu.Lock()
	defer hs.mu.Unlock()
	hs.userAgent = userAgent
	hs.minDelay = max(hs.minDelay, minDelay)
}

// SetHostCookie stuurt bij elk request naar deze host een vaste Cookie-header mee
// (bv. de valuta-instelling van een webshop).
func (f *Fetcher) SetHostCookie(hostName, cookie string) {
	hs := f.host(hostName)
	hs.mu.Lock()
	defer hs.mu.Unlock()
	hs.cookie = cookie
}

// Allowed controleert robots.txt voor de URL (robots.txt wordt één keer per host opgehaald).
func (f *Fetcher) Allowed(ctx context.Context, rawURL string) bool {
	u, err := url.Parse(rawURL)
	if err != nil {
		return false
	}
	hs := f.host(u.Host)
	hs.robotsOnce.Do(func() {
		robotsURL := u.Scheme + "://" + u.Host + "/robots.txt"
		resp, err := f.do(ctx, hs, u.Host, robotsURL)
		switch {
		case err == nil && resp.StatusCode == http.StatusOK:
			hs.robots = ParseRobots(string(resp.Body), "ModelbouwkortingenBot")
			if d := hs.robots.CrawlDelay; d > 0 {
				hs.mu.Lock()
				hs.minDelay = max(hs.minDelay, d)
				hs.mu.Unlock()
				f.log.Info("crawl-delay uit robots.txt", "host", u.Host, "delay", hs.minDelay)
			}
		case err == nil && resp.StatusCode >= 400 && resp.StatusCode < 500:
			hs.robots = &Robots{} // geen robots.txt = alles toegestaan
		default:
			// Onbereikbaar: wees voorzichtig en sta niets toe tot de volgende ronde.
			f.log.Warn("robots.txt niet op te halen, host wordt overgeslagen", "host", u.Host, "err", err)
			hs.robots = &Robots{rules: []robotsRule{{allow: false, pattern: "/"}}}
		}
	})
	path := u.EscapedPath()
	if u.RawQuery != "" {
		path += "?" + u.RawQuery
	}
	return hs.robots.Allowed(path)
}

// Get haalt een URL op met robots.txt-controle, rate limiting en retries.
// Bij 429 (of 503) wacht deze host 5s, daarna 10s, 20s, ... tot MaxBackoff.
func (f *Fetcher) Get(ctx context.Context, rawURL string) (*Response, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return nil, err
	}
	if !f.Allowed(ctx, rawURL) {
		f.stats.RobotsBlocked(u.Host)
		return nil, ErrRobots
	}
	hs := f.host(u.Host)

	var lastErr error
	for attempt := 0; attempt <= f.opts.MaxRetries; attempt++ {
		resp, err := f.do(ctx, hs, u.Host, rawURL)
		if err != nil {
			if ctx.Err() != nil {
				return nil, ctx.Err()
			}
			if errors.Is(err, ErrRobots) {
				return nil, err
			}
			lastErr = err
			if !sleep(ctx, time.Duration(attempt+1)*2*time.Second) {
				return nil, ctx.Err()
			}
			continue
		}
		switch {
		case resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode == http.StatusServiceUnavailable:
			wait := f.rateLimited(hs, u.Host, resp.Header.Get("Retry-After"))
			f.log.Warn("rate limited, host pauzeert", "host", u.Host, "status", resp.StatusCode, "wacht", wait, "url", rawURL)
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			continue // do() wacht zelf tot blockedUntil verstreken is
		case resp.StatusCode == http.StatusNotFound || resp.StatusCode == http.StatusGone:
			f.recovered(hs, u.Host)
			return resp, ErrNotFound
		case resp.StatusCode >= 500:
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			if !sleep(ctx, time.Duration(attempt+1)*3*time.Second) {
				return nil, ctx.Err()
			}
			continue
		case resp.StatusCode >= 400:
			return resp, fmt.Errorf("HTTP %d", resp.StatusCode)
		default:
			f.recovered(hs, u.Host)
			return resp, nil
		}
	}
	return nil, fmt.Errorf("opgegeven na %d pogingen: %w", f.opts.MaxRetries+1, lastErr)
}

// rateLimited verhoogt de backoff van een host: 5s, 10s, 20s, ... (of Retry-After als die langer is).
func (f *Fetcher) rateLimited(hs *host, hostName, retryAfter string) time.Duration {
	hs.mu.Lock()
	defer hs.mu.Unlock()
	// Andere workers die tegelijk een 429 kregen laten de backoff niet extra oplopen.
	if time.Now().Before(hs.blockedUntil) {
		return time.Until(hs.blockedUntil)
	}
	if hs.backoff == 0 {
		hs.backoff = f.opts.Backoff429
	} else {
		hs.backoff *= 2
	}
	if hs.backoff > f.opts.MaxBackoff {
		hs.backoff = f.opts.MaxBackoff
	}
	// Ook na de pauze rustiger aan doen: de shop vindt ons tempo blijkbaar te hoog.
	hs.okStreak = 0
	hs.delay = min(max(hs.delay*2, time.Second), maxHostDelay)
	wait := hs.backoff
	if ra := parseRetryAfter(retryAfter); ra > wait && ra <= 30*time.Minute {
		wait = ra
	}
	until := time.Now().Add(wait)
	if until.After(hs.blockedUntil) {
		hs.blockedUntil = until
	}
	f.stats.Backoff(hostName, wait, hs.blockedUntil)
	return wait
}

// recovered verlaagt na een reeks succesvolle requests de backoff en het tempo weer
// geleidelijk. Een 429 vlak na een geslaagde retry laat de backoff dus verder oplopen.
func (f *Fetcher) recovered(hs *host, hostName string) {
	hs.mu.Lock()
	hs.okStreak++
	cleared := false
	if hs.backoff != 0 && hs.okStreak >= 5 {
		hs.backoff = 0
		cleared = true
	}
	if floor := max(f.opts.HostDelay, hs.minDelay); hs.okStreak%20 == 0 && hs.delay > floor {
		hs.delay = max(floor, hs.delay*3/4)
	}
	hs.mu.Unlock()
	if cleared {
		f.stats.Backoff(hostName, 0, time.Time{})
	}
}

// reserve bepaalt wanneer deze worker zijn request mag doen en schuift het slot op.
func (f *Fetcher) reserve(hs *host) time.Time {
	hs.mu.Lock()
	defer hs.mu.Unlock()
	now := time.Now()
	at := now
	if hs.next.After(at) {
		at = hs.next
	}
	if hs.blockedUntil.After(at) {
		at = hs.blockedUntil
	}
	floor := max(f.opts.HostDelay, hs.minDelay)
	if hs.delay < floor {
		hs.delay = floor
	}
	hs.next = at.Add(hs.delay)
	return at
}

func (f *Fetcher) do(ctx context.Context, hs *host, hostName, rawURL string) (*Response, error) {
	if !sleep(ctx, time.Until(f.reserve(hs))) {
		return nil, ctx.Err()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return nil, err
	}
	hs.mu.Lock()
	ua := cmp.Or(hs.userAgent, f.opts.UserAgent)
	cookie := hs.cookie
	hs.mu.Unlock()
	if cookie != "" {
		req.Header.Set("Cookie", cookie)
	}
	req.Header.Set("User-Agent", ua)
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "nl-NL,nl;q=0.9,en;q=0.6")
	req.Header.Set("Accept-Encoding", "gzip")
	req.Header.Set("From", "crawler@modelbouwkortingen.nl")

	start := time.Now()
	resp, err := f.client.Do(req)
	if err != nil {
		if errors.Is(err, ErrRobots) {
			f.stats.RobotsBlocked(hostName)
			return nil, ErrRobots
		}
		f.stats.Request(hostName, 0, 0, time.Since(start), err)
		return nil, err
	}
	defer resp.Body.Close()

	var reader io.Reader = resp.Body
	if strings.EqualFold(resp.Header.Get("Content-Encoding"), "gzip") {
		gz, err := gzip.NewReader(resp.Body)
		if err != nil {
			f.stats.Request(hostName, resp.StatusCode, 0, time.Since(start), err)
			return nil, err
		}
		defer gz.Close()
		reader = gz
	}
	body, err := io.ReadAll(io.LimitReader(reader, maxBodySize))
	f.stats.Request(hostName, resp.StatusCode, int64(len(body)), time.Since(start), err)
	if err != nil {
		return nil, err
	}
	return &Response{URL: resp.Request.URL.String(), StatusCode: resp.StatusCode, Body: body, Header: resp.Header}, nil
}

func parseRetryAfter(v string) time.Duration {
	if v == "" {
		return 0
	}
	if secs, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
		return time.Duration(secs) * time.Second
	}
	if t, err := http.ParseTime(v); err == nil {
		return time.Until(t)
	}
	return 0
}

func sleep(ctx context.Context, d time.Duration) bool {
	if d <= 0 {
		return ctx.Err() == nil
	}
	t := time.NewTimer(d)
	defer t.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-t.C:
		return true
	}
}
