package logbuf

import (
	"io"
	"log/slog"
	"testing"
)

func TestBuffer(t *testing.T) {
	buf := New(5, 2)
	log := slog.New(buf.Handler(slog.NewTextHandler(io.Discard, &slog.HandlerOptions{Level: slog.LevelDebug})))
	shop := log.With("shop", "toprc")

	shop.Warn("rate limited", "status", 429)
	for i := range 10 {
		shop.Info("product", "naam", i)
	}
	log.With("shop", "toemen").Error("ophalen mislukt", "url", "https://example.com")
	log.Debug("details")

	all := buf.Query(Query{MinLevel: slog.LevelDebug})
	if len(all.Entries) != 5 || all.Latest != 13 {
		t.Fatalf("ringbuffer: %d regels, latest %d; wilde 5 en 13", len(all.Entries), all.Latest)
	}
	if last := all.Entries[4]; last.Msg != "details" || last.Level != "DEBUG" {
		t.Fatalf("nieuwste regel = %+v", last)
	}

	// De waarschuwing is uit de grote buffer verdwenen, maar staat nog in de kleine.
	warn := buf.Query(Query{MinLevel: slog.LevelWarn})
	if len(warn.Entries) != 2 || warn.Entries[0].Msg != "rate limited" || warn.Entries[0].Shop != "toprc" || warn.Entries[0].Attrs["status"] != "429" {
		t.Fatalf("waarschuwingen: %+v", warn.Entries)
	}

	if r := buf.Query(Query{MinLevel: slog.LevelDebug, Shop: "toemen"}); len(r.Entries) != 1 || r.Entries[0].Attrs["url"] != "https://example.com" {
		t.Fatalf("filter op shop: %+v", r.Entries)
	}
	if r := buf.Query(Query{MinLevel: slog.LevelDebug, HideProducts: true}); len(r.Entries) != 2 {
		t.Fatalf("zonder productregels: %+v", r.Entries)
	}
	if r := buf.Query(Query{MinLevel: slog.LevelDebug, Text: "EXAMPLE.com"}); len(r.Entries) != 1 {
		t.Fatalf("zoeken: %+v", r.Entries)
	}
	if r := buf.Query(Query{MinLevel: slog.LevelDebug, After: 12}); len(r.Entries) != 1 || r.Entries[0].Seq != 13 {
		t.Fatalf("after: %+v", r.Entries)
	}
	if r := buf.Query(Query{MinLevel: slog.LevelDebug, Limit: 2}); len(r.Entries) != 2 || r.Entries[1].Seq != 13 {
		t.Fatalf("limit moet de nieuwste houden: %+v", r.Entries)
	}
}
