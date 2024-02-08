package entity

import (
	"github.com/google/uuid"
)

type UserAnswer struct {
	UserAnswerID uuid.UUID `json:"user_answer_id"`
	UserID       uuid.UUID `json:"user_id"`
	TryoutID     uuid.UUID `json:"tryout_id"`
	QuestionID   uuid.UUID `json:"question_id"`
	UserAnswer   string    `json:"user_answer"`
}

func (UserAnswer) TableName() string {
	return "users_answers"
}
