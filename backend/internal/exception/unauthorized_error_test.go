package exception

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUnauthorizedError(t *testing.T) {
	t.Run("creates unauthorized error", func(t *testing.T) {
		err := UnauthorizedError{
			Message: "unauthorized access",
		}
		
		assert.Equal(t, "unauthorized access", err.Error())
	})

	t.Run("implements error interface", func(t *testing.T) {
		var err error = UnauthorizedError{
			Message: "invalid credentials",
		}
		
		assert.NotNil(t, err)
		assert.Equal(t, "invalid credentials", err.Error())
	})
}
