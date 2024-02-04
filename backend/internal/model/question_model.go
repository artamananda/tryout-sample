package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateQuestionRequest struct {
	Text          string          `json:"text" validate:"required"`
	Options       []string `json:"options" validate:"required,min=1,dive"`
	CorrectAnswer string          `json:"correct_answer" validate:"required"`
	Points        int             `json:"points" validate:"required"`
}

type UpdateQuestionRequest struct {
	Text          string          `json:"text"`
	Options       []string `json:"options" validate:"min=1,dive"`
	CorrectAnswer string          `json:"correct_answer"`
	Points        int             `json:"points"`
}

type QuestionResponse struct {
	QuestionID    uuid.UUID       `json:"question_id"`
	TryoutID      uuid.UUID       `json:"tryout_id"`
	Text          string          `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string          `json:"correct_answer"`
	Points        int             `json:"points"`
	CreatedAt     time.Time       `json:"created_at"`
	UpdatedAt     time.Time       `json:"updated_at"`
}
