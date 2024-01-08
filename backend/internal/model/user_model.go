package model

import (
	"time"

	"github.com/google/uuid"
)

type UserModel struct {
	UserId    uuid.UUID `json:"user_id"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Email     string    `json:"email"`
	Password  string    `json:"password"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"deleted_at"`
}

func (UserModel) TableName() string {
	return "users"
}
