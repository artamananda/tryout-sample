package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ChatArtifact struct {
	ID             uuid.UUID       `gorm:"primaryKey" json:"id"`
	ChatLogID      uuid.UUID       `json:"chat_log_id"`
	Type           string          `json:"type"`                              // question, etc
	Content        json.RawMessage `gorm:"type:jsonb" json:"content"`         // The question JSON
	ReferencesData json.RawMessage `gorm:"type:jsonb" json:"references_data"` // Array of {topic, content}
	Metadata       json.RawMessage `gorm:"type:jsonb" json:"metadata"`        // model used, tokens etc
	UserFeedback   string          `json:"user_feedback"`
	Status         string          `json:"status"` // generated, edited
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

func (ChatArtifact) TableName() string {
	return "chat_artifacts"
}
