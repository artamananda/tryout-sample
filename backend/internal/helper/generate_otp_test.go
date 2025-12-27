package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateOTP(t *testing.T) {
	tests := []struct {
		name      string
		maxDigits uint32
	}{
		{
			name:      "generate 4 digits OTP",
			maxDigits: 4,
		},
		{
			name:      "generate 6 digits OTP",
			maxDigits: 6,
		},
		{
			name:      "generate 8 digits OTP",
			maxDigits: 8,
		},
		{
			name:      "generate 1 digit OTP",
			maxDigits: 1,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			otp := GenerateOTP(tt.maxDigits)
			assert.NotEmpty(t, otp)
			assert.Equal(t, int(tt.maxDigits), len(otp))
			// Verify it contains only digits
			for _, char := range otp {
				assert.True(t, char >= '0' && char <= '9')
			}
		})
	}

	// Test uniqueness - generate multiple OTPs and verify they're different
	t.Run("generate unique OTPs", func(t *testing.T) {
		otps := make(map[string]bool)
		for i := 0; i < 10; i++ {
			otp := GenerateOTP(6)
			otps[otp] = true
		}
		// It's highly unlikely to get duplicates with 6-digit OTPs
		assert.Greater(t, len(otps), 1)
	})
}
