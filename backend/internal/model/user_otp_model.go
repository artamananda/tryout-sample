package model

import (
	"time"
)

type CreateUserOtpRequest struct {
	Email string `json:"email"`
	Name  string `json:"name"`
}

type UserOtpResponse struct {
	Email     string    `json:"email"`
	ExpiredAt time.Time `json:"expired_at"`
	CreatedAt time.Time `json:"created_at"`
}

type SendOtpConfig struct {
	SmtpHost     string
	SmtpPort     string
	SenderName   string
	AuthEmail    string
	AuthPassword string
}
