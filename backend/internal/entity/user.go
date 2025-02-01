package entity

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Password   string    `json:"password"`
	Role       string    `json:"role"`
	NISN       string    `json:"nisn"`
	Grade      string    `json:"grade"`
	School     string    `json:"school"`
	Regency    string    `json:"regency"`
	Province   string    `json:"province"`
	PictureURL string    `json:"picture_url"`
	LastLogin  time.Time `json:"last_login"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"deleted_at"`
}

func (User) TableName() string {
	return "users"
}
