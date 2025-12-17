package config

import (
"testing"
"github.com/stretchr/testify/assert"
)

func TestNewAWSConfig(t *testing.T) {
t.Run("AWS config creation", func(t *testing.T) {
config := New()
assert.NotNil(t, config)
// AWS config may fail without proper credentials, which is acceptable
})
}
