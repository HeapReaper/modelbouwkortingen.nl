// Package config leest de crawler-configuratie uit environment variabelen en flags.
package config

import (
	"flag"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// DefaultUserAgent ziet eruit als een normale browser, maar vermeldt duidelijk wie
// er crawlt en hoe webshops contact kunnen opnemen.
const DefaultUserAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
	"Chrome/130.0.0.0 Safari/537.36 (compatible; ModelbouwkortingenBot/1.0; +https://modelbouwkortingen.nl/over)"

type Config struct {
	DatabaseURL string
	Shops       []string // leeg = alle shops

	WorkersPerShop int
	HostDelay      time.Duration // minimale tijd tussen twee requests naar dezelfde host
	RequestTimeout time.Duration
	MaxRetries     int
	Backoff429     time.Duration // eerste wachttijd na een 429, verdubbelt bij elke volgende 429
	MaxBackoff     time.Duration

	Interval        time.Duration // tijd tussen twee volledige crawl-rondes
	RunOnce         bool
	DryRun          bool // niet naar de database schrijven, alleen loggen
	MaxProductPages int  // max productpagina's per shop per ronde (0 = onbeperkt)
	MaxListingPages int  // max listing/categoriepagina's per shop per ronde (0 = onbeperkt)
	RecrawlAfter    time.Duration
	StaleAfter      time.Duration // deals die zo lang niet meer gezien zijn worden uitgezet

	MinDiscountEUR     float64
	MinDiscountPercent float64

	UserAgent  string
	HTTPAddr   string
	StatsToken string
}

func Load() (*Config, error) {
	c := &Config{
		DatabaseURL:        env("DATABASE_URL", ""),
		WorkersPerShop:     envInt("CRAWLER_WORKERS_PER_SHOP", 4),
		HostDelay:          envDuration("CRAWLER_HOST_DELAY", 500*time.Millisecond),
		RequestTimeout:     envDuration("CRAWLER_REQUEST_TIMEOUT", 30*time.Second),
		MaxRetries:         envInt("CRAWLER_MAX_RETRIES", 6),
		Backoff429:         envDuration("CRAWLER_BACKOFF_429", 5*time.Second),
		MaxBackoff:         envDuration("CRAWLER_MAX_BACKOFF", 5*time.Minute),
		Interval:           envDuration("CRAWLER_INTERVAL", 6*time.Hour),
		RunOnce:            envBool("CRAWLER_RUN_ONCE", false),
		DryRun:             envBool("CRAWLER_DRY_RUN", false),
		MaxProductPages:    envInt("CRAWLER_MAX_PRODUCT_PAGES", 4000),
		MaxListingPages:    envInt("CRAWLER_MAX_LISTING_PAGES", 0),
		RecrawlAfter:       envDuration("CRAWLER_RECRAWL_AFTER", 20*time.Hour),
		StaleAfter:         envDuration("CRAWLER_STALE_AFTER", 96*time.Hour),
		MinDiscountEUR:     envFloat("MIN_DISCOUNT_EUR", 5),
		MinDiscountPercent: envFloat("MIN_DISCOUNT_PERCENT", 5),
		UserAgent:          env("CRAWLER_USER_AGENT", DefaultUserAgent),
		HTTPAddr:           env("CRAWLER_HTTP_ADDR", ":8080"),
		StatsToken:         env("CRAWLER_STATS_TOKEN", ""),
	}
	shops := env("CRAWLER_SHOPS", "")

	flag.BoolVar(&c.RunOnce, "once", c.RunOnce, "één crawl-ronde draaien en stoppen")
	flag.BoolVar(&c.DryRun, "dry-run", c.DryRun, "niets naar de database schrijven")
	flag.StringVar(&shops, "shops", shops, "komma-gescheiden lijst van shops (toprc,toemen,wetronic)")
	flag.IntVar(&c.MaxProductPages, "max-products", c.MaxProductPages, "max productpagina's per shop per ronde (0 = alles)")
	flag.IntVar(&c.MaxListingPages, "max-listings", c.MaxListingPages, "max listingpagina's per shop (0 = alles)")
	flag.IntVar(&c.WorkersPerShop, "workers", c.WorkersPerShop, "aantal gelijktijdige workers per shop")
	flag.StringVar(&c.HTTPAddr, "http", c.HTTPAddr, "adres voor de stats/health HTTP server (leeg = uit)")
	flag.Parse()

	for _, s := range strings.Split(shops, ",") {
		if s = strings.TrimSpace(strings.ToLower(s)); s != "" {
			c.Shops = append(c.Shops, s)
		}
	}
	if !c.DryRun && c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is niet gezet (gebruik -dry-run om zonder database te testen)")
	}
	if c.WorkersPerShop < 1 {
		c.WorkersPerShop = 1
	}
	return c, nil
}

func env(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}

func envInt(key string, def int) int {
	if v, err := strconv.Atoi(env(key, "")); err == nil {
		return v
	}
	return def
}

func envFloat(key string, def float64) float64 {
	if v, err := strconv.ParseFloat(env(key, ""), 64); err == nil {
		return v
	}
	return def
}

func envBool(key string, def bool) bool {
	if v, err := strconv.ParseBool(env(key, "")); err == nil {
		return v
	}
	return def
}

func envDuration(key string, def time.Duration) time.Duration {
	if v, err := time.ParseDuration(env(key, "")); err == nil {
		return v
	}
	return def
}
