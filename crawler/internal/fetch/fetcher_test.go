package fetch

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
)

// Een robots.txt die tijdelijk niet op te halen is, mag de host niet voorgoed blokkeren.
func TestRobotsFailureIsRetried(t *testing.T) {
	oldTTL, oldWait := robotsFailTTL, robotsRetryWait
	robotsFailTTL, robotsRetryWait = 50*time.Millisecond, 0
	t.Cleanup(func() { robotsFailTTL, robotsRetryWait = oldTTL, oldWait })

	var down atomic.Bool
	var robotsHits atomic.Int64
	down.Store(true)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/robots.txt" {
			robotsHits.Add(1)
			if down.Load() {
				w.WriteHeader(http.StatusBadGateway)
				return
			}
			io.WriteString(w, "User-agent: *\nDisallow: /private/\n")
			return
		}
		io.WriteString(w, "ok")
	}))
	defer srv.Close()

	f := New(Options{UserAgent: "test", Timeout: 5 * time.Second}, stats.New(), slog.New(slog.DiscardHandler))
	ctx := context.Background()

	if f.Allowed(ctx, srv.URL+"/product") {
		t.Fatal("robots.txt onbereikbaar: host moet voorlopig dicht zijn")
	}
	if got := robotsHits.Load(); got != robotsAttempts {
		t.Errorf("robots.txt %d keer opgehaald, want %d", got, robotsAttempts)
	}
	if f.Allowed(ctx, srv.URL+"/product") || robotsHits.Load() != robotsAttempts {
		t.Error("binnen robotsFailTTL moet de mislukking gecachet blijven")
	}

	down.Store(false)
	time.Sleep(60 * time.Millisecond)
	if !f.Allowed(ctx, srv.URL+"/product") {
		t.Error("na robotsFailTTL moet robots.txt opnieuw opgehaald worden")
	}
	if f.Allowed(ctx, srv.URL+"/private/x") {
		t.Error("regels uit de nieuwe robots.txt moeten gelden")
	}
	hits := robotsHits.Load()
	f.Allowed(ctx, srv.URL+"/product")
	if robotsHits.Load() != hits {
		t.Error("een geslaagde robots.txt moet gecachet worden")
	}
}

// Een afgebroken context mag geen blokkade achterlaten.
func TestRobotsCancelledNotCached(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "User-agent: *\nDisallow:\n")
	}))
	defer srv.Close()
	f := New(Options{UserAgent: "test", Timeout: 5 * time.Second}, stats.New(), slog.New(slog.DiscardHandler))

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if f.Allowed(ctx, srv.URL+"/x") {
		t.Error("afgebroken context: niet toegestaan")
	}
	if !f.Allowed(context.Background(), srv.URL+"/x") {
		t.Error("na een afgebroken fetch moet robots.txt gewoon opgehaald worden")
	}
}
