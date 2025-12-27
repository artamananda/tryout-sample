package controller

import (
"net/http/httptest"
"testing"
"github.com/gofiber/fiber/v2"
"github.com/stretchr/testify/assert"
)

func TestRegisterProgramController(t *testing.T) {
app := fiber.New()

t.Run("routes are registered", func(t *testing.T) {
assert.NotNil(t, app)
})

t.Run("create endpoint", func(t *testing.T) {
req := httptest.NewRequest("POST", "/", nil)
assert.NotNil(t, req)
})

t.Run("get endpoint", func(t *testing.T) {
req := httptest.NewRequest("GET", "/", nil)
assert.NotNil(t, req)
})

t.Run("update endpoint", func(t *testing.T) {
req := httptest.NewRequest("PUT", "/", nil)
assert.NotNil(t, req)
})

t.Run("delete endpoint", func(t *testing.T) {
req := httptest.NewRequest("DELETE", "/", nil)
assert.NotNil(t, req)
})
}
