// Package logbuf houdt de laatste logregels van de crawler in het geheugen, zodat het admin
// panel ze kan tonen (GET /logs op de stats-server). Alles wat naar stdout gaat komt ook hier.
//
// Er zijn twee ringbuffers: één met alle regels en één met alleen waarschuwingen en fouten.
// Zo verdwijnt een fout niet binnen een paar seconden tussen de duizenden "product"-regels.
package logbuf

import (
	"cmp"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Entry struct {
	Seq   uint64            `json:"seq"`
	Time  time.Time         `json:"time"`
	Level string            `json:"level"`
	Msg   string            `json:"msg"`
	Shop  string            `json:"shop,omitempty"`
	Attrs map[string]string `json:"attrs,omitempty"`
}

type ring struct {
	items []Entry
	next  int
	full  bool
}

func (r *ring) add(e Entry) {
	r.items[r.next] = e
	r.next = (r.next + 1) % len(r.items)
	if r.next == 0 {
		r.full = true
	}
}

// each loopt van oud naar nieuw.
func (r *ring) each(fn func(Entry)) {
	if r.full {
		for _, e := range r.items[r.next:] {
			fn(e)
		}
	}
	for _, e := range r.items[:r.next] {
		fn(e)
	}
}

type Buffer struct {
	mu        sync.Mutex
	seq       uint64
	all       ring
	important ring
}

func New(size, importantSize int) *Buffer {
	return &Buffer{
		all:       ring{items: make([]Entry, size)},
		important: ring{items: make([]Entry, importantSize)},
	}
}

func (b *Buffer) add(e Entry, level slog.Level) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.seq++
	e.Seq = b.seq
	b.all.add(e)
	if level >= slog.LevelWarn {
		b.important.add(e)
	}
}

type Query struct {
	MinLevel     slog.Level
	Shop         string
	Text         string // hoofdletterongevoelig, in bericht en attributen
	After        uint64 // alleen regels met een hoger volgnummer
	Limit        int
	HideProducts bool // de "product"-regel die bij elk gevonden product gelogd wordt
}

// Result bevat de nieuwste overeenkomende regels (oud naar nieuw) en het hoogste volgnummer
// tot nu toe, zodat de volgende vraag met After verder kan.
type Result struct {
	Entries []Entry `json:"entries"`
	Latest  uint64  `json:"latest"`
}

func (b *Buffer) Query(q Query) Result {
	b.mu.Lock()
	defer b.mu.Unlock()
	src := &b.all
	if q.MinLevel >= slog.LevelWarn {
		src = &b.important
	}
	text := strings.ToLower(q.Text)
	var out []Entry
	src.each(func(e Entry) {
		if e.Seq == 0 || e.Seq <= q.After || levelOf(e.Level) < q.MinLevel {
			return
		}
		if q.Shop != "" && e.Shop != q.Shop {
			return
		}
		if q.HideProducts && e.Msg == "product" {
			return
		}
		if text != "" && !matches(e, text) {
			return
		}
		out = append(out, e)
	})
	if q.Limit > 0 && len(out) > q.Limit {
		out = out[len(out)-q.Limit:]
	}
	return Result{Entries: out, Latest: b.seq}
}

func matches(e Entry, text string) bool {
	if strings.Contains(strings.ToLower(e.Msg), text) {
		return true
	}
	for k, v := range e.Attrs {
		if strings.Contains(strings.ToLower(k+"="+v), text) {
			return true
		}
	}
	return false
}

func levelOf(s string) slog.Level {
	var l slog.Level
	_ = l.UnmarshalText([]byte(s))
	return l
}

// Handler stuurt elke regel door naar next en bewaart hem ook in de buffer.
func (b *Buffer) Handler(next slog.Handler) slog.Handler {
	return &handler{next: next, buf: b}
}

type handler struct {
	next   slog.Handler
	buf    *Buffer
	attrs  []slog.Attr
	prefix string // van WithGroup
}

func (h *handler) Enabled(ctx context.Context, l slog.Level) bool { return h.next.Enabled(ctx, l) }

func (h *handler) Handle(ctx context.Context, r slog.Record) error {
	e := Entry{Time: r.Time, Level: r.Level.String(), Msg: r.Message, Attrs: map[string]string{}}
	add := func(prefix string, a slog.Attr) {
		key := prefix + a.Key
		val := a.Value.Resolve().String()
		if key == "shop" {
			e.Shop = val
			return
		}
		e.Attrs[key] = val
	}
	for _, a := range h.attrs {
		add("", a)
	}
	r.Attrs(func(a slog.Attr) bool {
		add(h.prefix, a)
		return true
	})
	if len(e.Attrs) == 0 {
		e.Attrs = nil
	}
	h.buf.add(e, r.Level)
	return h.next.Handle(ctx, r)
}

func (h *handler) WithAttrs(as []slog.Attr) slog.Handler {
	c := *h
	c.next = h.next.WithAttrs(as)
	c.attrs = append([]slog.Attr{}, h.attrs...)
	for _, a := range as {
		c.attrs = append(c.attrs, slog.Attr{Key: h.prefix + a.Key, Value: a.Value})
	}
	return &c
}

func (h *handler) WithGroup(name string) slog.Handler {
	c := *h
	c.next = h.next.WithGroup(name)
	c.prefix = h.prefix + name + "."
	return &c
}

// ServeHTTP: GET /logs?level=info&shop=toprc&q=429&after=123&limit=500&products=0
func (b *Buffer) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	v := req.URL.Query()
	q := Query{
		MinLevel:     levelOf(cmp.Or(v.Get("level"), "DEBUG")),
		Shop:         v.Get("shop"),
		Text:         v.Get("q"),
		Limit:        500,
		HideProducts: v.Get("products") == "0",
	}
	q.After, _ = strconv.ParseUint(v.Get("after"), 10, 64)
	if n, err := strconv.Atoi(v.Get("limit")); err == nil && n > 0 && n <= 2000 {
		q.Limit = n
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	_ = json.NewEncoder(w).Encode(b.Query(q))
}
