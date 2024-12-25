package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateProgramRequest struct {
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	MaxParticipants   int       `json:"max_participants"`
	IsPublished       bool      `json:"is_published"`
	PictureURL        string    `json:"picture_url"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
	OpenRegistration  time.Time `json:"open_registration"`
	CloseRegistration time.Time `json:"close_registration"`
}

type ProgramResponse struct {
	ProgramID         uuid.UUID `json:"program_id"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	MaxParticipants   int       `json:"max_participants"`
	IsPublished       bool      `json:"is_published"`
	PictureURL        string    `json:"picture_url"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
	OpenRegistration  time.Time `json:"open_registration"`
	CloseRegistration time.Time `json:"close_registration"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"deleted_at"`
}

type FindAllProgramsRequest struct {
	Search      string `json:"search"`
	IsPublished *bool  `json:"is_published"`
	UserID      string `json:"user_id"`
}

type UpdateProgramRequest struct {
	ProgramID         uuid.UUID `json:"program_id"`
	Name              string    `json:"name"`
	Description       string    `json:"description"`
	MaxParticipants   int       `json:"max_participants"`
	IsPublished       bool      `json:"is_published"`
	PictureURL        string    `json:"picture_url"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
	OpenRegistration  time.Time `json:"open_registration"`
	CloseRegistration time.Time `json:"close_registration"`
}
