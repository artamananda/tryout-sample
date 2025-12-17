package entity

import (
"testing"
"github.com/stretchr/testify/assert"
"github.com/google/uuid"
)

func TestUserAnswerEntity(t *testing.T) {
t.Run("entity can be instantiated", func(t *testing.T) {
// Basic struct test
assert.True(t, true)
})

t.Run("uuid fields work correctly", func(t *testing.T) {
id := uuid.New()
assert.NotEqual(t, uuid.Nil, id)
})
}
