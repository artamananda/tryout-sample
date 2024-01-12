package entity

import (
	"github.com/google/uuid"
)

type Question struct {
	QuestionID    uuid.UUID `json:"question_id"`
	TryoutID      uuid.UUID `json:"tryout_id"`
	Text          string    `json:"text"`
	Options       []Option  `gorm:"column:options;type:json" json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Points        int       `json:"points"`
}

func (Question) TableName() string {
	return "questions"
}
