package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tryout struct {
	TryoutID  uuid.UUID  `json:"tryout_id"`
	Title     string     `json:"title"`
	Duration  int        `json:"duration"`
	StartTime time.Time  `json:"start_time"`
	EndTime   time.Time  `json:"end_time"`
	Questions []Question `json:"questions"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (Tryout) TableName() string {
	return "tryouts"
}

type Question struct {
	QuestionID    uuid.UUID `json:"question_id"`
	TryoutID      uuid.UUID `json:"tryout_id"`
	Text          string    `json:"text"`
	Options       []Option  `json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Points        int       `json:"points"`
}

func (Question) TableName() string {
	return "questions"
}

type Option struct {
	OptionID   uuid.UUID `json:"option_id"`
	QuestionID uuid.UUID `json:"question_id"`
	Text       string    `json:"text"`
}

func (Option) TableName() string {
	return "options"
}
