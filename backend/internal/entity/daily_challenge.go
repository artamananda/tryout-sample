package entity

import (
	"time"

	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type DailyChallenge struct {
	ChallengeID   uuid.UUID      `gorm:"primaryKey" json:"challenge_id"`
	ChallengeDate time.Time      `gorm:"type:date;unique" json:"challenge_date"`
	QuestionIDs   pq.StringArray `gorm:"type:uuid[]" json:"question_ids"`
	Title         string         `json:"title"`
	Description   string         `json:"description"`
	BonusPoints   int            `json:"bonus_points"`
	Status        string         `json:"status"` // active, completed, expired
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

func (DailyChallenge) TableName() string {
	return "daily_challenges"
}
