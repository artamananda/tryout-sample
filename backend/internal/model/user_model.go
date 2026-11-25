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
	Username   string `json:"username" validate:"required,min=3,max=50"`
	Name       string `json:"name" validate:"required,max=100"`
	Email      string `json:"email" validate:"required,email,max=100"`
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
	Username   string `json:"username" validate:"required,min=3,max=50"`
	Name       string `json:"name" validate:"required,max=100"`
	Email      string `json:"email" validate:"required,email,max=100"`
	Password   string `json:"password" validate:"required"`
	Role       string `json:"role" validate:"required,oneof=admin user"`
	NISN       string `json:"nisn"`
	Grade      string `json:"grade"`
	School     string `json:"school"`
	Regency    string `json:"regency"`
	Province   string `json:"province"`
	PictureURL string `json:"picture_url"`
}

// ProfileFields are the profile attributes a user may change about themselves.
// Every field is a pointer: a field that is absent from the JSON body is left
// untouched, while an empty string clears it. The tags only bound lengths;
// formats (gender, education, birth date, username) are checked in the user
// service because the validator also applies rules to empty pointed-to values.
type ProfileFields struct {
	Username       *string `json:"username" validate:"omitempty,max=50"`
	Name           *string `json:"name" validate:"omitempty,max=100"`
	PhoneNumber    *string `json:"phone_number" validate:"omitempty,max=25"`
	Gender         *string `json:"gender" validate:"omitempty,max=10"`
	BirthDate      *string `json:"birth_date" validate:"omitempty,max=10"`
	LastEducation  *string `json:"last_education" validate:"omitempty,max=20"`
	Major          *string `json:"major" validate:"omitempty,max=150"`
	TargetAgency   *string `json:"target_agency" validate:"omitempty,max=150"`
	TargetPosition *string `json:"target_position" validate:"omitempty,max=150"`
	NISN           *string `json:"nisn" validate:"omitempty,max=10"`
	Grade          *string `json:"grade" validate:"omitempty,max=10"`
	School         *string `json:"school" validate:"omitempty,max=255"`
	Regency        *string `json:"regency" validate:"omitempty,max=255"`
	Province       *string `json:"province" validate:"omitempty,max=255"`
}

// UpdateMyProfileRequest is sent by a logged-in user to PATCH /me.
// Email and role are intentionally not part of it.
type UpdateMyProfileRequest struct {
	ProfileFields
}

// UpdateUserRequest is sent by an admin to PATCH /user/:id.
type UpdateUserRequest struct {
	ProfileFields
	Email *string `json:"email" validate:"omitempty,email,max=100"`
	Role  *string `json:"role" validate:"omitempty,oneof=admin user"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=6,max=72"`
}

type GetUserResponse struct {
	UserID         uuid.UUID  `json:"user_id"`
	Username       string     `json:"username"`
	Name           string     `json:"name"`
	Email          string     `json:"email"`
	Role           string     `json:"role"`
	PhoneNumber    string     `json:"phone_number"`
	Gender         string     `json:"gender"`
	BirthDate      string     `json:"birth_date"`
	LastEducation  string     `json:"last_education"`
	Major          string     `json:"major"`
	TargetAgency   string     `json:"target_agency"`
	TargetPosition string     `json:"target_position"`
	NISN           string     `json:"nisn"`
	Grade          string     `json:"grade"`
	School         string     `json:"school"`
	Regency        string     `json:"regency"`
	Province       string     `json:"province"`
	PictureURL     string     `json:"picture_url"`
	Badges         UserBadges `json:"badges"`
	LastLogin      time.Time  `json:"last_login"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

// RegisterResponse and UpdateUserResponse share the user response shape.
type RegisterResponse = GetUserResponse
type UpdateUserResponse = GetUserResponse

type FindAllUserRequest struct {
	Search string `json:"search"`
	Role   string `json:"role"`
	// Verified limits the list to users with (true) or without (false) the blue check.
	Verified *bool `json:"verified"`
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
	NewPassword string `json:"new_password" validate:"required,min=6,max=72"`
}

// VerifiedLabels are the reasons an admin may give the blue check for.
var VerifiedLabels = map[string]string{
	"owner":       "Owner TELISIK",
	"tutor":       "Tutor",
	"berprestasi": "Siswa Berprestasi",
}

// UserBadges are the badges shown next to a user's name.
type UserBadges struct {
	// Verified is the blue check; only admins grant it.
	Verified *VerifiedBadge `json:"verified,omitempty"`
	// ProfileComplete is true once every field in ProfileMissing is filled.
	ProfileComplete bool     `json:"profile_complete"`
	ProfileMissing  []string `json:"profile_missing,omitempty"`
	// Package is the highest paid package the user holds, if any.
	Package *PackageBadge `json:"package,omitempty"`
}

type VerifiedBadge struct {
	Label      string    `json:"label"`
	LabelName  string    `json:"label_name"`
	VerifiedAt time.Time `json:"verified_at"`
}

type PackageBadge struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type SetVerificationRequest struct {
	Label string `json:"label" validate:"required,oneof=owner tutor berprestasi"`
}
