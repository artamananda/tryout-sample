package entity

import (
	"time"

	"github.com/google/uuid"
)

// AIExample represents a saved internal prompt example
type AIExample struct {
	ID        uuid.UUID `json:"id"`
	CreatedBy uuid.UUID `json:"created_by"`
	Topic     string    `json:"topic"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}
