package helper

import (
	"errors"
	"strings"
)

// NormalizePhoneNumber converts Indonesian phone numbers to the 62xxxxxxxxxx
// format used by WhatsApp. "0812-3456-7890", "+62 812 3456 7890" and
// "8123456789" all become "6281234567890". An empty input stays empty.
func NormalizePhoneNumber(input string) (string, error) {
	var digits strings.Builder
	for _, r := range input {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	phone := digits.String()
	if phone == "" {
		return "", nil
	}

	switch {
	case strings.HasPrefix(phone, "62"):
	case strings.HasPrefix(phone, "0"):
		phone = "62" + phone[1:]
	case strings.HasPrefix(phone, "8"):
		phone = "62" + phone
	default:
		return "", errors.New("nomor WhatsApp harus nomor Indonesia (diawali 08 atau +62)")
	}

	if len(phone) < 10 || len(phone) > 15 || !strings.HasPrefix(phone, "628") {
		return "", errors.New("nomor WhatsApp tidak valid")
	}
	return phone, nil
}
