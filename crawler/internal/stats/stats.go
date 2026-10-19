// Package stats houdt live statistieken van de crawler bij en serveert ze via HTTP,
// zodat het admin panel van de website kan zien wat de crawler aan het doen is.
package stats

import (
	"crypto/subtle"
	"encoding/json"
	"net/http"
	"sort"
	"sync"
	"time"
)

type HostStats struct {
	Host          string    `json:"host"`
	Requests      int64     `json:"requests"`
	OK            int64     `json:"ok"`
	Errors        int64     `json:"errors"`
	RateLimited   int64     `json:"rateLimited"`
	NotFound      int64     `json:"notFound"`
	RobotsBlocked int64     `json:"robotsBlocked"`
	Bytes         int64     `json:"bytes"`
	Backoff       string    `json:"backoff"`
	BlockedUntil  time.Time `json:"blockedUntil,omitzero"`
	LastStatus    int       `json:"lastStatus"`
	LastError     string    `json:"lastError,omitempty"`
	LastRequestAt time.Time `json:"lastRequestAt,omitzero"`
	AvgLatencyMs  int64     `json:"avgLatencyMs"`
	latencyTotal  time.Duration
}

type ShopStats struct {
	Shop          string    `json:"shop"`
	Phase         string    `json:"phase"` // idle | sitemap | listings | products | finishing
	RunID         int64     `json:"runId,omitempty"`
	RunStartedAt  time.Time `json:"runStartedAt,omitzero"`
	LastRunAt     time.Time `json:"lastRunAt,omitzero"`
	LastRunStatus string    `json:"lastRunStatus,omitempty"`
	QueueTotal    int64     `json:"queueTotal"`
	QueueDone     int64     `json:"queueDone"`
	ProductsSeen  int64     `json:"productsSeen"`
	DealsFound    int64     `json:"dealsFound"`
	ParseErrors   int64     `json:"parseErrors"`
	SitemapURLs   int64     `json:"sitemapUrls"`
}

type Registry struct {
	mu        sync.Mutex
	startedAt time.Time
	hosts     map[string]*HostStats
	shops     map[string]*ShopStats
}

func New() *Registry {
	return &Registry{startedAt: time.Now(), hosts: map[string]*HostStats{}, shops: map[string]*ShopStats{}}
}

func (r *Registry) host(h string) *HostStats {
	hs, ok := r.hosts[h]
	if !ok {
		hs = &HostStats{Host: h}
		r.hosts[h] = hs
	}
	return hs
}

func (r *Registry) shop(s string) *ShopStats {
	ss, ok := r.shops[s]
	if !ok {
		ss = &ShopStats{Shop: s, Phase: "idle"}
		r.shops[s] = ss
	}
	return ss
}

// Request registreert de uitkomst van één HTTP request.
func (r *Registry) Request(host string, status int, bytes int64, latency time.Duration, err error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	hs := r.host(host)
	hs.Requests++
	hs.LastStatus = status
	hs.LastRequestAt = time.Now()
	hs.Bytes += bytes
	hs.latencyTotal += latency
	hs.AvgLatencyMs = (hs.latencyTotal / time.Duration(hs.Requests)).Milliseconds()
	switch {
	case err != nil:
		hs.Errors++
		hs.LastError = err.Error()
	case status == http.StatusTooManyRequests:
		hs.RateLimited++
	case status == http.StatusNotFound || status == http.StatusGone:
		hs.NotFound++
	case status >= 200 && status < 300:
		hs.OK++
	default:
		hs.Errors++
	}
}

// RateLimited geeft het totaal aantal 429/503 responses van een host.
func (r *Registry) RateLimited(host string) int64 {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.host(host).RateLimited
}

func (r *Registry) RobotsBlocked(host string) {
	r.mu.Lock()
	r.host(host).RobotsBlocked++
	r.mu.Unlock()
}

func (r *Registry) Backoff(host string, d time.Duration, until time.Time) {
	r.mu.Lock()
	hs := r.host(host)
	if d == 0 {
		hs.Backoff = ""
		hs.BlockedUntil = time.Time{}
	} else {
		hs.Backoff = d.String()
		hs.BlockedUntil = until
	}
	r.mu.Unlock()
}

// UpdateShop past de stats van een shop atomair aan.
func (r *Registry) UpdateShop(shop string, fn func(s *ShopStats)) {
	r.mu.Lock()
	fn(r.shop(shop))
	r.mu.Unlock()
}

type Snapshot struct {
	StartedAt time.Time   `json:"startedAt"`
	Uptime    string      `json:"uptime"`
	Now       time.Time   `json:"now"`
	Shops     []ShopStats `json:"shops"`
	Hosts     []HostStats `json:"hosts"`
}

func (r *Registry) Snapshot() Snapshot {
	r.mu.Lock()
	defer r.mu.Unlock()
	s := Snapshot{StartedAt: r.startedAt, Uptime: time.Since(r.startedAt).Round(time.Second).String(), Now: time.Now()}
	for _, v := range r.shops {
		s.Shops = append(s.Shops, *v)
	}
	for _, v := range r.hosts {
		s.Hosts = append(s.Hosts, *v)
	}
	sort.Slice(s.Shops, func(i, j int) bool { return s.Shops[i].Shop < s.Shops[j].Shop })
	sort.Slice(s.Hosts, func(i, j int) bool { return s.Hosts[i].Host < s.Hosts[j].Host })
	return s
}

// Handler serveert /healthz, /stats, (als logs niet nil is) /logs en (als run niet nil is)
// POST /run. Als token niet leeg is, vereisen alle behalve /healthz een
// "Authorization: Bearer <token>" header.
func (r *Registry) Handler(token string, logs, run http.Handler) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"status":"ok"}`))
	})
	mux.Handle("GET /stats", requireToken(token, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Cache-Control", "no-store")
		_ = json.NewEncoder(w).Encode(r.Snapshot())
	})))
	if logs != nil {
		mux.Handle("GET /logs", requireToken(token, logs))
	}
	if run != nil {
		mux.Handle("POST /run", requireToken(token, run))
	}
	return mux
}

func requireToken(token string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if token != "" {
			got := req.Header.Get("Authorization")
			if subtle.ConstantTimeCompare([]byte(got), []byte("Bearer "+token)) != 1 {
				http.Error(w, "unauthorized", http.StatusUnauthorized)
				return
			}
		}
		next.ServeHTTP(w, req)
	})
}
