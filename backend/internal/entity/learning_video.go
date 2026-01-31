package entity

import (
	"time"
)

type LearningVideo struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	URL       string    `json:"url"`
	ProgramID *string   `json:"program_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// TableName specifies the table name for LearningVideo
func (LearningVideo) TableName() string {
	return "learning_videos"
}
