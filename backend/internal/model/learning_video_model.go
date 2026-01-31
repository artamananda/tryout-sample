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
	Page      int     `json:"page"`
	PageSize  int     `json:"page_size"`
}

type LearningVideoResponse struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	ProgramID *string   `json:"program_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
