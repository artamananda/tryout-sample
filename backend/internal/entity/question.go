package entity

import (
	"time"

	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type Question struct {
	QuestionID    uuid.UUID `gorm:"primaryKey" json:"question_id"`
	TryoutID      uuid.UUID `json:"tryout_id"`
	Text          string    `json:"text"`
	Options       pq.StringArray  `gorm:"type:text[]" json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Points        int       `json:"points"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (Question) TableName() string {
	return "questions"
}
