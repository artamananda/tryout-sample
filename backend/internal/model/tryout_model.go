package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateTryoutRequest struct {
	Title     string    `json:"title" validate:"required"`
	Duration  int       `json:"duration" validate:"required,min=1"`
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time" validate:"required"`
}

type UpdateTryoutRequest struct {
	Title     string    `json:"title"`
	Duration  int       `json:"duration"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type TryoutResponse struct {
	TryoutID  uuid.UUID `json:"tryout_id"`
	Title     string    `json:"title"`
	Duration  int       `json:"duration"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CreateQuestionRequest struct {
	Text          string          `json:"text" validate:"required"`
	Options       []OptionRequest `json:"options" validate:"required,min=2,dive"`
	CorrectAnswer string          `json:"correct_answer" validate:"required"`
	Points        int             `json:"points" validate:"required"`
}

type UpdateQuestionRequest struct {
	Text          string          `json:"text"`
	Options       []OptionRequest `json:"options" validate:"min=2,dive"`
	CorrectAnswer string          `json:"correct_answer"`
	Points        int             `json:"points"`
}

type QuestionResponse struct {
	QuestionID    uuid.UUID        `json:"question_id"`
	TryoutID      uuid.UUID        `json:"tryout_id"`
	Text          string           `json:"text"`
	Options       []OptionResponse `json:"options"`
	CorrectAnswer string           `json:"correct_answer"`
	Points        int              `json:"points"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

type OptionRequest struct {
	Text string `json:"text" validate:"required"`
}

type OptionResponse struct {
	OptionID   uuid.UUID `json:"option_id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
}
