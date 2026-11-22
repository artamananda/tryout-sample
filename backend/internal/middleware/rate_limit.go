package middleware

import (
	"sync"
	"time"

	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
)

// ClientIP returns the caller's IP. On fly.io the proxy puts the real client
// address in Fly-Client-IP; elsewhere fall back to the connection address.
func ClientIP(c *fiber.Ctx) string {
	if ip := c.Get("Fly-Client-IP"); ip != "" {
		return ip
	}
	return c.IP()
}

type rateWindow struct {
	count   int
	resetAt time.Time
}

// fixedWindowLimiter counts requests per key in fixed time windows. It is
// in-memory, so each API instance keeps its own counters.
type fixedWindowLimiter struct {
	mu        sync.Mutex
	max       int
	window    time.Duration
	entries   map[string]*rateWindow
	lastSweep time.Time
}

func (l *fixedWindowLimiter) allow(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	// Drop expired windows now and then so the map cannot grow forever.
	if now.Sub(l.lastSweep) > l.window {
		for k, entry := range l.entries {
			if now.After(entry.resetAt) {
				delete(l.entries, k)
			}
		}
		l.lastSweep = now
	}

	entry, ok := l.entries[key]
	if !ok || now.After(entry.resetAt) {
		l.entries[key] = &rateWindow{count: 1, resetAt: now.Add(l.window)}
		return true
	}
	if entry.count >= l.max {
		return false
	}
	entry.count++
	return true
}

// RateLimit allows max requests per client IP within windowSeconds.
func RateLimit(max int, windowSeconds int) fiber.Handler {
	l := &fixedWindowLimiter{
		max:     max,
		window:  time.Duration(windowSeconds) * time.Second,
		entries: map[string]*rateWindow{},
	}
	return func(c *fiber.Ctx) error {
		if !l.allow(ClientIP(c), time.Now()) {
			return c.Status(fiber.StatusTooManyRequests).JSON(model.GeneralResponse{
				Code:    429,
				Message: "Too Many Requests",
				Data:    "Terlalu banyak percobaan, silakan coba lagi beberapa menit lagi",
			})
		}
		return c.Next()
	}
}
