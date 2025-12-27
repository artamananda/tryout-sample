package exception

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNotFoundError(t *testing.T) {
	t.Run("creates not found error", func(t *testing.T) {
		err := NotFoundError{
			Message: "resource not found",
		}
		
		assert.Equal(t, "resource not found", err.Error())
	})

	t.Run("implements error interface", func(t *testing.T) {
		var err error = NotFoundError{
			Message: "test message",
		}
		
		assert.NotNil(t, err)
		assert.Equal(t, "test message", err.Error())
	})
}
