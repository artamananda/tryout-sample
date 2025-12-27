package config

import (
"testing"
"github.com/stretchr/testify/assert"
)

func TestNew(t *testing.T) {
t.Run("creates config successfully", func(t *testing.T) {
config := New()
assert.NotNil(t, config)
})
}

func TestConfig_Get(t *testing.T) {
t.Run("gets config value", func(t *testing.T) {
config := New()
// Test that Get method works
value := config.Get("SERVER")
assert.NotNil(t, value)
})

t.Run("returns value for existing key", func(t *testing.T) {
config := New()
value := config.Get("PORT")
// Should return a value (default or from env)
assert.NotNil(t, value)
})
}
