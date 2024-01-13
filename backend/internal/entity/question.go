package entity

import (
	"time"

	"github.com/google/uuid"
)

type Question struct {
	QuestionID    uuid.UUID `gorm:"primaryKey" json:"question_id"`
	TryoutID      uuid.UUID `json:"tryout_id"`
	Text          string    `json:"text"`
	Options       []Option  `gorm:"column:options;type:jsonb" json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Points        int       `json:"points"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (Question) TableName() string {
	return "questions"
}

type Option struct {
	OptionName string `json:"option_name"`
	OptionText string `json:"option_text"`
}
