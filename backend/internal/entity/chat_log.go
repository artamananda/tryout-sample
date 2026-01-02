package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ChatMessage struct {
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

type ChatLog struct {
	ChatLogID    uuid.UUID       `gorm:"primaryKey" json:"chat_log_id"`
	AdminID      uuid.UUID       `json:"admin_id"`
	QuestionType string          `json:"question_type"`
	Topic        string          `json:"topic"`
	Messages     json.RawMessage `gorm:"type:jsonb" json:"messages"`
	Status       string          `json:"status"` // pending, processed, failed
	ProcessedAt  *time.Time      `json:"processed_at"`
	ErrorMessage string          `json:"error_message"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

func (ChatLog) TableName() string {
	return "chat_logs"
}

// ChatLogStatus constants
const (
	ChatLogStatusPending   = "pending"
	ChatLogStatusProcessed = "processed"
	ChatLogStatusFailed    = "failed"
)
