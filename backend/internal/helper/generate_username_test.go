package helper

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGenerateUsernameByEmail(t *testing.T) {
	tests := []struct {
		name  string
		email string
		want  string
	}{
		{
			name:  "standard email",
			email: "john.doe@example.com",
			want:  "john.doe",
		},
		{
			name:  "email with uppercase",
			email: "John.Doe@Example.Com",
			want:  "john.doe",
		},
		{
			name:  "email with spaces",
			email: "john doe@example.com",
			want:  "johndoe",
		},
		{
			name:  "email with numbers",
			email: "user123@test.com",
			want:  "user123",
		},
		{
			name:  "email with special chars",
			email: "user+test@example.com",
			want:  "user+test",
		},
		{
			name:  "invalid email without @",
			email: "notanemail.com",
			want:  "",
		},
		{
			name:  "empty email",
			email: "",
			want:  "",
		},
		{
			name:  "email with @ at start",
			email: "@example.com",
			want:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := GenerateUsernameByEmail(tt.email)
			assert.Equal(t, tt.want, got)
		})
	}
}
