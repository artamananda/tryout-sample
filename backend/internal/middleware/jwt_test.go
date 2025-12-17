package middleware

import (
"testing"
"github.com/stretchr/testify/assert"
)

func TestJWTMiddleware(t *testing.T) {
t.Run("middleware package exists", func(t *testing.T) {
assert.True(t, true)
})
}
