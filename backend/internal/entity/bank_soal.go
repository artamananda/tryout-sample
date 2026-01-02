package entity

import (
	"time"

	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type BankSoal struct {
	BankSoalID    uuid.UUID      `gorm:"primaryKey" json:"bank_soal_id"`
	Type          string         `json:"type"`
	Text          string         `json:"text"`
	ImageUrl      string         `json:"image_url"`
	IsOptions     *bool          `json:"is_options"`
	Options       pq.StringArray `gorm:"type:text[]" json:"options"`
	CorrectAnswer string         `json:"correct_answer"`
	Explanation   string         `json:"explanation"`
	Difficulty    string         `json:"difficulty"`
	Topic         string         `json:"topic"`
	Points        int            `json:"points"`
	IsAIGenerated bool           `json:"is_ai_generated"`
	CreatedBy     uuid.UUID      `json:"created_by"`
	// Status workflow fields
	Status          string     `json:"status"` // draft, ready, published, duplicate
	SimilarityScore *float64   `json:"similarity_score"`
	SimilarToID     *uuid.UUID `json:"similar_to_id"`
	ProcessedByCron bool       `json:"processed_by_cron"`
	PublishedAt     *time.Time `json:"published_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (BankSoal) TableName() string {
	return "bank_soals"
}

// BankSoal status constants
const (
	BankSoalStatusDraft     = "draft"
	BankSoalStatusReady     = "ready"
	BankSoalStatusPublished = "published"
	BankSoalStatusDuplicate = "duplicate"
)
