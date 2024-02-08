package model

import (
	"github.com/google/uuid"
)

type CreateUserAnswerRequest struct {
	UserID     uuid.UUID `json:"user_id"`
	TryoutID   uuid.UUID `json:"tryout_id"`
	QuestionID uuid.UUID `json:"question_id"`
	UserAnswer string    `json:"user_answer"`
}

type UpdateUserAnswerRequest struct {
	UserID     uuid.UUID `json:"user_id"`
	TryoutID   uuid.UUID `json:"tryout_id"`
	QuestionID uuid.UUID `json:"question_id"`
	UserAnswer string    `json:"user_answer"`
}

type UserAnswerResponse struct {
	UserAnswerID uuid.UUID `json:"user_answer_id"`
	UserID       uuid.UUID `json:"user_id"`
	TryoutID     uuid.UUID `json:"tryout_id"`
	QuestionID   uuid.UUID `json:"question_id"`
	UserAnswer   string    `json:"user_answer"`
}
