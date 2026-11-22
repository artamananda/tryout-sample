package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNormalizePhoneNumber(t *testing.T) {
	valid := map[string]string{
		"":                  "",
		"081234567890":      "6281234567890",
		"0812-3456-7890":    "6281234567890",
		"+62 812 3456 7890": "6281234567890",
		"6281234567890":     "6281234567890",
		"81234567890":       "6281234567890",
	}
	for input, expected := range valid {
		got, err := NormalizePhoneNumber(input)
		assert.NoError(t, err, input)
		assert.Equal(t, expected, got, input)
	}

	for _, input := range []string{"12345", "0212345", "+1 555 123 4567", "0812"} {
		_, err := NormalizePhoneNumber(input)
		assert.Error(t, err, input)
	}
}
