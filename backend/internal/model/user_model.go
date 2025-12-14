package model

import (
	"time"

	"github.com/google/uuid"
)

type LoginRequest struct {
	Email    string `json:"email" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

type SelfRegisterRequest struct {
	Username   string `json:"username" validate:"required"`
	Name       string `json:"name" validate:"required"`
	Email      string `json:"email" validate:"required"`
	Password   string `json:"password" validate:"required"`
	Otp        string `json:"otp" validate:"required"`
	NISN       string `json:"nisn"`
	Grade      string `json:"grade"`
	School     string `json:"school"`
	Regency    string `json:"regency"`
	Province   string `json:"province"`
	PictureURL string `json:"picture_url"`
}

type RegisterRequest struct {
	Username   string `json:"username" validate:"required"`
	Name       string `json:"name" validate:"required"`
	Email      string `json:"email" validate:"required"`
	Password   string `json:"password" validate:"required"`
	Role       string `json:"role" validate:"required"`
	NISN       string `json:"nisn"`
	Grade      string `json:"grade"`
	School     string `json:"school"`
	Regency    string `json:"regency"`
	Province   string `json:"province"`
	PictureURL string `json:"picture_url"`
}

type RegisterResponse struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	NISN       string    `json:"nisn"`
	Grade      string    `json:"grade"`
	School     string    `json:"school"`
	Regency    string    `json:"regency"`
	Province   string    `json:"province"`
	PictureURL string    `json:"picture_url"`
}

type UpdateUserRequest struct {
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	// Password   string    `json:"password"`
	Role       string    `json:"role"`
	NISN       string    `json:"nisn"`
	Grade      string    `json:"grade"`
	School     string    `json:"school"`
	Regency    string    `json:"regency"`
	Province   string    `json:"province"`
	PictureURL string    `json:"picture_url"`
	LastLogin  time.Time `json:"last_login"`
}

type UpdateUserResponse struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	NISN       string    `json:"nisn"`
	Grade      string    `json:"grade"`
	School     string    `json:"school"`
	Regency    string    `json:"regency"`
	Province   string    `json:"province"`
	PictureURL string    `json:"picture_url"`
	LastLogin  time.Time `json:"last_login"`
}

type GetUserResponse struct {
	UserID     uuid.UUID `json:"user_id"`
	Username   string    `json:"username"`
	Name       string    `json:"name"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	NISN       string    `json:"nisn"`
	Grade      string    `json:"grade"`
	School     string    `json:"school"`
	Regency    string    `json:"regency"`
	Province   string    `json:"province"`
	PictureURL string    `json:"picture_url"`
	LastLogin  time.Time `json:"last_login"`
	CreatedAt  time.Time `json:"created_at"`
}

type FindAllUserRequest struct {
	Search string `json:"search"`
	Role   string `json:"role"`
}

type CheckByEmailRequest struct {
	Email string `json:"email" validate:"required"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Otp         string `json:"otp" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6"`
}
