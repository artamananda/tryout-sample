package middleware

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestFixedWindowLimiter(t *testing.T) {
	l := &fixedWindowLimiter{max: 2, window: time.Minute, entries: map[string]*rateWindow{}}
	now := time.Now()

	assert.True(t, l.allow("a", now))
	assert.True(t, l.allow("a", now))
	assert.False(t, l.allow("a", now), "third request in the window is rejected")
	assert.True(t, l.allow("b", now), "other clients are counted separately")
	assert.True(t, l.allow("a", now.Add(time.Minute+time.Second)), "a new window starts after expiry")
}

func TestRateLimitMiddleware(t *testing.T) {
	app := fiber.New()
	app.Get("/", RateLimit(1, 60), func(c *fiber.Ctx) error { return c.SendString("ok") })

	first, _ := app.Test(httptest.NewRequest("GET", "/", nil))
	assert.Equal(t, fiber.StatusOK, first.StatusCode)

	second, _ := app.Test(httptest.NewRequest("GET", "/", nil))
	assert.Equal(t, fiber.StatusTooManyRequests, second.StatusCode)
}
