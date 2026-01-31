package model

import (
	"time"
)

type CreateLearningVideoRequest struct {
	Title     string  `json:"title" validate:"required"`
	URL       string  `json:"url" validate:"required"`
	ProgramID *string `json:"program_id"`
}

type UpdateLearningVideoRequest struct {
	Title     string  `json:"title"`
	URL       string  `json:"url"`
	ProgramID *string `json:"program_id"`
}

type FindAllLearningVideoRequest struct {
	Search    string  `json:"search"`
	ProgramID *string `json:"program_id"`
	Offset    int     `json:"offset"`
	Limit     int     `json:"limit"`
	IsAdmin   bool    `json:"is_admin"`
}

type LearningVideoResponse struct {
	ID            int       `json:"id"`
	Title         string    `json:"title"`
	URL           string    `json:"url"`
	ProgramID     *string   `json:"program_id"`
	ProgramName   *string   `json:"program_name"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
