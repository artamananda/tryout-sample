package exception

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidationError(t *testing.T) {
	t.Run("creates validation error", func(t *testing.T) {
		err := ValidationError{
			Message: "validation failed",
		}
		
		assert.Equal(t, "validation failed", err.Error())
	})

	t.Run("implements error interface", func(t *testing.T) {
		var err error = ValidationError{
			Message: "invalid input",
		}
		
		assert.NotNil(t, err)
		assert.Equal(t, "invalid input", err.Error())
	})
}
