package common

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestNewLogger(t *testing.T) {
	t.Run("creates logger successfully", func(t *testing.T) {
		// Clean up logs directory if it exists
		defer os.RemoveAll("logs")
		
		logger := NewLogger()
		
		assert.NotNil(t, logger)
		
		// Verify logs directory was created
		_, err := os.Stat("logs")
		assert.False(t, os.IsNotExist(err))
	})

	t.Run("logger can write logs", func(t *testing.T) {
		defer os.RemoveAll("logs")
		
		logger := NewLogger()
		logger.Info("test log message")
		logger.Error("test error message")
		logger.Warn("test warning message")
		
		// Verify log file was created
		entries, err := os.ReadDir("logs")
		assert.NoError(t, err)
		assert.Greater(t, len(entries), 0)
	})
}
