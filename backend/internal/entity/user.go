package entity

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	UserID          uuid.UUID  `json:"user_id"`
	Username        string     `json:"username"`
	Name            string     `json:"name"`
	Email           string     `json:"email"`
	Password        string     `json:"-"`
	Role            string     `json:"role"`
	PhoneNumber     string     `json:"phone_number"`
	PhoneVerifiedAt *time.Time `json:"phone_verified_at"`
	ReferralCode    *string    `json:"referral_code"`
	Gender          string     `json:"gender"`
	BirthDate       *time.Time `json:"birth_date"`
	LastEducation   string     `json:"last_education"`
	Major           string     `json:"major"`
	TargetAgency    string     `json:"target_agency"`
	TargetPosition  string     `json:"target_position"`
	NISN            string     `json:"nisn"`
	Grade           string     `json:"grade"`
	School          string     `json:"school"`
	Regency         string     `json:"regency"`
	Province        string     `json:"province"`
	PictureURL      string     `json:"picture_url"`
	// Blue check, granted only by an admin (see model.VerifiedLabels).
	VerifiedLabel *string    `json:"verified_label"`
	VerifiedAt    *time.Time `json:"verified_at"`
	VerifiedBy    *uuid.UUID `json:"verified_by"`
	LastLogin     time.Time  `json:"last_login"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
