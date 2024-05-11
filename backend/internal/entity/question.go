package entity

import (
	"time"

	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type Question struct {
	QuestionID    uuid.UUID      `gorm:"primaryKey" json:"question_id"`
	TryoutID      uuid.UUID      `json:"tryout_id"`
	LocalID       int            `json:"local_id"`
	Type          string         `json:"type"`
	Text          string         `json:"text"`
	ImageUrl      string         `json:"image_url"`
	IsOptions     *bool          `json:"is_options"`
	Options       pq.StringArray `gorm:"type:text[]" json:"options"`
	CorrectAnswer string         `json:"correct_answer"`
	Points        int            `json:"points"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

func (Question) TableName() string {
	return "questions"
}
