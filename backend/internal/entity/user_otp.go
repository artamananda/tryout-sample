package entity

import (
	"time"
)

type UserOtp struct {
	Email     string    `json:"email"`
	Otp       string    `json:"otp"`
	ExpiredAt time.Time `json:"expired_at"`
	CreatedAt time.Time `json:"created_at"`
}

func (UserOtp) TableName() string {
	return "user_otp"
}
