package helper

import (
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestGenerateInvoiceNumber(t *testing.T) {
	t.Run("generates valid invoice number", func(t *testing.T) {
		invoice := GenerateInvoiceNumber()
		
		// Check format: INV-TIMESTAMP-RANDOM
		assert.True(t, strings.HasPrefix(invoice, "INV-"))
		
		// Split by hyphen
		parts := strings.Split(invoice, "-")
		assert.Equal(t, 3, len(parts))
		
		// Check timestamp part (should be 14 digits)
		assert.Equal(t, 14, len(parts[1]))
		
		// Check random part (should be 4 uppercase characters)
		assert.Equal(t, 4, len(parts[2]))
		for _, char := range parts[2] {
			assert.True(t, (char >= 'A' && char <= 'Z') || (char >= '0' && char <= '9'))
		}
	})

	t.Run("generates unique invoice numbers", func(t *testing.T) {
		invoice1 := GenerateInvoiceNumber()
		time.Sleep(10 * time.Millisecond) // Small delay to ensure different timestamp
		invoice2 := GenerateInvoiceNumber()
		
		assert.NotEqual(t, invoice1, invoice2)
	})

	t.Run("invoice contains current date", func(t *testing.T) {
		now := time.Now()
		invoice := GenerateInvoiceNumber()
		
		// Extract timestamp part
		parts := strings.Split(invoice, "-")
		timestamp := parts[1]
		
		// Check year (first 4 chars)
		year := timestamp[:4]
		assert.Equal(t, now.Format("2006"), year)
		
		// Check month (chars 5-6)
		month := timestamp[4:6]
		assert.Equal(t, now.Format("01"), month)
		
		// Check day (chars 7-8)
		day := timestamp[6:8]
		assert.Equal(t, now.Format("02"), day)
	})
}
