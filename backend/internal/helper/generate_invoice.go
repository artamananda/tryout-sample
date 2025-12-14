package helper

import (
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

// GenerateInvoiceNumber membuat invoice number unik
func GenerateInvoiceNumber() string {
	// Format timestamp: YYYYMMDDHHMMSS
	ts := time.Now().Format("20060102150405")

	// Ambil 4 karakter pertama dari UUID, uppercase
	randPart := strings.ToUpper(uuid.New().String()[:4])

	// Gabungkan menjadi invoice number
	invoiceNumber := fmt.Sprintf("INV-%s-%s", ts, randPart)
	return invoiceNumber
}
