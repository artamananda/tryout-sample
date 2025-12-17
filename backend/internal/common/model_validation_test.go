package common

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

type testStruct struct {
	Email    string `validate:"required,email"`
	Username string `validate:"required,min=3,max=50"`
	Age      int    `validate:"required,min=1,max=150"`
}

func TestValidate(t *testing.T) {
	t.Run("valid struct passes validation", func(t *testing.T) {
		valid := testStruct{
			Email:    "test@example.com",
			Username: "testuser",
			Age:      25,
		}

		err := Validate(valid)
		assert.NoError(t, err)
	})

	t.Run("missing required field fails", func(t *testing.T) {
		invalid := testStruct{
			Email:    "",
			Username: "testuser",
			Age:      25,
		}

		err := Validate(invalid)
		assert.Error(t, err)
	})

	t.Run("invalid email fails", func(t *testing.T) {
		invalid := testStruct{
			Email:    "not-an-email",
			Username: "testuser",
			Age:      25,
		}

		err := Validate(invalid)
		assert.Error(t, err)
	})

	t.Run("username too short fails", func(t *testing.T) {
		invalid := testStruct{
			Email:    "test@example.com",
			Username: "ab",
			Age:      25,
		}

		err := Validate(invalid)
		assert.Error(t, err)
	})

	t.Run("age out of range fails", func(t *testing.T) {
		invalid := testStruct{
			Email:    "test@example.com",
			Username: "testuser",
			Age:      200,
		}

		err := Validate(invalid)
		assert.Error(t, err)
	})

	t.Run("multiple validation errors", func(t *testing.T) {
		invalid := testStruct{
			Email:    "invalid",
			Username: "ab",
			Age:      0,
		}

		err := Validate(invalid)
		assert.Error(t, err)
	})
}
