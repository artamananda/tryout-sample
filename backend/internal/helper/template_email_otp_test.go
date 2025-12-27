package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTemplateEmailOtp(t *testing.T) {
	tests := []struct {
		name     string
		userName string
		otp      string
	}{
		{
			name:     "standard template",
			userName: "John Doe",
			otp:      "123456",
		},
		{
			name:     "template with special characters in name",
			userName: "John O'Brien",
			otp:      "999999",
		},
		{
			name:     "template with empty name",
			userName: "",
			otp:      "111111",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TemplateEmailOtp(tt.userName, tt.otp)
			
			// Verify HTML structure
			assert.Contains(t, result, "<html>")
			assert.Contains(t, result, "</html>")
			assert.Contains(t, result, "TELISIK SYSTEM")
			
			// Verify name and OTP are included
			assert.Contains(t, result, tt.userName)
			assert.Contains(t, result, tt.otp)
			
			// Verify key content
			assert.Contains(t, result, "Terima kasih telah mendaftar")
			assert.Contains(t, result, "One-Time Password")
		})
	}
}

func TestTemplateEmailRegisterGenerate(t *testing.T) {
	tests := []struct {
		name     string
		userName string
		email    string
		password string
	}{
		{
			name:     "standard template",
			userName: "John Doe",
			email:    "john@example.com",
			password: "Password123",
		},
		{
			name:     "template with special characters",
			userName: "Jane O'Connor",
			email:    "jane+test@example.com",
			password: "P@ssw0rd!",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TemplateEmailRegisterGenerate(tt.userName, tt.email, tt.password)
			
			// Verify HTML structure
			assert.Contains(t, result, "<html>")
			assert.Contains(t, result, "</html>")
			assert.Contains(t, result, "TELISIK SYSTEM")
			
			// Verify user data is included
			assert.Contains(t, result, tt.userName)
			assert.Contains(t, result, tt.email)
			assert.Contains(t, result, tt.password)
			
			// Verify key content
			assert.Contains(t, result, "Selamat datang di Telisik")
			assert.Contains(t, result, "Email:")
			assert.Contains(t, result, "Password:")
			assert.Contains(t, result, "Masuk Grup WhatsApp")
		})
	}
}

func TestTemplateProgramRegistrationSuccess(t *testing.T) {
	tests := []struct {
		name          string
		userName      string
		email         string
		invoiceNumber string
		programName   string
	}{
		{
			name:          "standard template",
			userName:      "John Doe",
			email:         "john@example.com",
			invoiceNumber: "INV-20240101120000-ABCD",
			programName:   "UTBK Program",
		},
		{
			name:          "template with long program name",
			userName:      "Jane Smith",
			email:         "jane@example.com",
			invoiceNumber: "INV-20240202140000-WXYZ",
			programName:   "Program Intensif Persiapan UTBK SNBT 2024",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := TemplateProgramRegistrationSuccess(tt.userName, tt.email, tt.invoiceNumber, tt.programName)
			
			// Verify HTML structure
			assert.Contains(t, result, "<!DOCTYPE html>")
			assert.Contains(t, result, "<html>")
			assert.Contains(t, result, "</html>")
			assert.Contains(t, result, "TELISIK SYSTEM")
			
			// Verify all data is included
			assert.Contains(t, result, tt.userName)
			assert.Contains(t, result, tt.email)
			assert.Contains(t, result, tt.invoiceNumber)
			assert.Contains(t, result, tt.programName)
			
			// Verify key content
			assert.Contains(t, result, "Terima kasih telah melakukan pendaftaran program")
			assert.Contains(t, result, "Nama Program")
			assert.Contains(t, result, "Nomor Invoice")
			assert.Contains(t, result, "Masuk Grup WhatsApp")
		})
	}
}
