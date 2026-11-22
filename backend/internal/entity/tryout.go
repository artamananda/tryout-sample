package entity

import (
	"time"

	"github.com/google/uuid"
)

type Tryout struct {
	TryoutID    uuid.UUID  `gorm:"primaryKey" json:"tryout_id"`
	ProgramID   *uuid.UUID `json:"program_id"`
	Title       string     `json:"title"`
	Duration    int        `json:"duration"`
	StartTime   time.Time  `json:"start_time"`
	EndTime     time.Time  `json:"end_time"`
	Token       string     `json:"token"`
	IsPublished bool       `json:"is_published"`
	ShowScore   bool       `json:"show_score"`
	Sequence    int        `json:"sequence"`
	ScoringMode string     `json:"scoring_mode"`
	Questions   []Question `gorm:"foreignKey:TryoutID" json:"questions"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (Tryout) TableName() string {
	return "tryouts"
}

// Scoring modes. IRT is the weighted UTBK-style score; SKD follows the BKN rules
// (TWK/TIU 5 or 0 per question, TKP 1-5 per option).
const (
	ScoringModeIRT = "irt"
	ScoringModeSKD = "skd"
)
