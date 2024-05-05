package entity

import (
	"time"

	"github.com/google/uuid"
)

type TransactionTryout struct {
	TransactionTryoutID uuid.UUID `gorm:"primaryKey" json:"transaction_tryout_id"`
	TryoutID            uuid.UUID `json:"tryout_id"`
	UserID              uuid.UUID `json:"user_id"`
	Status              string    `json:"status"`
	StartTime           time.Time `json:"start_time"`
	EndTime             time.Time `json:"end_time"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (TransactionTryout) TableName() string {
	return "transaction_tryouts"
}
