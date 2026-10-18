package sitemap

import (
	"bytes"
	"compress/gzip"
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/fetch"
	"codeberg.org/HeapReaper/modelbouwkortingen.nl/crawler/internal/stats"
)

const fullSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/a</loc></url>
  <url><loc>https://example.com/b</loc></url>
</urlset>`

func TestFetchRetriesTruncatedSitemap(t *testing.T) {
	retryWait = 10 * time.Millisecond
	requests := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/robots.txt" {
			http.NotFound(w, r)
			return
		}
		requests++
		if requests == 1 {
			// Half bestand, zoals Berlinski soms levert.
			io.WriteString(w, fullSitemap[:len(fullSitemap)/2])
			return
		}
		io.WriteString(w, fullSitemap)
	}))
	defer srv.Close()

	f := fetch.New(fetch.Options{UserAgent: "test", Timeout: 5 * time.Second}, stats.New(), slog.New(slog.DiscardHandler))
	urls, err := Fetch(context.Background(), f, srv.URL+"/sitemap.xml", nil)
	if err != nil {
		t.Fatalf("Fetch: %v", err)
	}
	if len(urls) != 2 || requests != 2 {
		t.Fatalf("kreeg %d URL's na %d verzoeken, wilde 2 na 2", len(urls), requests)
	}
}

func TestFetchGivesUpAfterSecondTruncatedSitemap(t *testing.T) {
	retryWait = 10 * time.Millisecond
	requests := 0
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/robots.txt" {
			http.NotFound(w, r)
			return
		}
		requests++
		io.WriteString(w, fullSitemap[:len(fullSitemap)/2])
	}))
	defer srv.Close()

	f := fetch.New(fetch.Options{UserAgent: "test", Timeout: 5 * time.Second}, stats.New(), slog.New(slog.DiscardHandler))
	if _, err := Fetch(context.Background(), f, srv.URL+"/sitemap.xml", nil); err == nil {
		t.Fatal("verwachtte een fout bij een kapotte sitemap")
	}
	if requests != 2 {
		t.Fatalf("%d verzoeken, wilde 2", requests)
	}
}

func TestFetchUnzipsRawGzipSitemap(t *testing.T) {
	var gz bytes.Buffer
	zw := gzip.NewWriter(&gz)
	io.WriteString(zw, fullSitemap)
	zw.Close()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/robots.txt" {
			http.NotFound(w, r)
			return
		}
		// Zoals Banggood: een .xml.gz als gewoon bestand, zonder Content-Encoding.
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Write(gz.Bytes())
	}))
	defer srv.Close()

	f := fetch.New(fetch.Options{UserAgent: "test", Timeout: 5 * time.Second}, stats.New(), slog.New(slog.DiscardHandler))
	urls, err := Fetch(context.Background(), f, srv.URL+"/sitemap.xml.gz", nil)
	if err != nil {
		t.Fatalf("Fetch: %v", err)
	}
	if len(urls) != 2 {
		t.Fatalf("kreeg %d URL's, wilde 2", len(urls))
	}
}
