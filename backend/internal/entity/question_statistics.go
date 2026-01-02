package entity

import (
	"time"

	"github.com/google/uuid"
)

type QuestionStatistics struct {
	StatID               uuid.UUID `gorm:"primaryKey" json:"stat_id"`
	BankSoalID           uuid.UUID `json:"bank_soal_id"`
	TotalAttempts        int       `json:"total_attempts"`
	CorrectAttempts      int       `json:"correct_attempts"`
	AvgTimeSeconds       float64   `json:"avg_time_seconds"`
	CalculatedDifficulty string    `json:"calculated_difficulty"`
	LastUpdated          time.Time `json:"last_updated"`
	CreatedAt            time.Time `json:"created_at"`
}

func (QuestionStatistics) TableName() string {
	return "question_statistics"
}
