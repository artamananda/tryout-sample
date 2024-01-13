package entity

import (
	"github.com/google/uuid"
)

type UserAnswer struct {
	UserID           uuid.UUID `json:"user_id"`
	QuestionID       uuid.UUID `json:"question_id"`
	SelectedOptionID string    `json:"selected_option"`
}

func (UserAnswer) TableName() string {
	return "user_answers"
}
