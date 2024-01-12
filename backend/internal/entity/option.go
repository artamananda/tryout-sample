package entity

import "github.com/google/uuid"

type Option struct {
	OptionID   uuid.UUID `json:"option_id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
}

func (Option) TableName() string {
	return "options"
}
