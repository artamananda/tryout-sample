package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateQuestionRequest struct {
	Type          string   `json:"type"`
	Text          string   `json:"text" validate:"required"`
	ImageUrl      string   `json:"image_url"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer" validate:"required"`
	Points        int      `json:"points"`
}

type UpdateQuestionRequest struct {
	Type          string   `json:"type"`
	Text          string   `json:"text"`
	ImageUrl      string   `json:"image_url"`
	Options       []string `json:"options" validate:"min=1,dive"`
	CorrectAnswer string   `json:"correct_answer"`
	Points        int      `json:"points"`
}

type QuestionResponse struct {
	QuestionID    uuid.UUID `json:"question_id"`
	TryoutID      uuid.UUID `json:"tryout_id"`
	Type          string    `json:"type"`
	Text          string    `json:"text"`
	ImageUrl      string    `json:"image_url"`
	Options       []string  `json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Points        int       `json:"points"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
