package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateTransactionTryoutRequest struct {
	TryoutID uuid.UUID `json:"tryout_id"`
	UserID   uuid.UUID `json:"user_id"`
}

type UpdateTransactionTryoutRequest struct {
	TransactionTryoutID uuid.UUID `json:"transaction_tryout_id"`
	TryoutID            uuid.UUID `json:"tryout_id"`
	UserID              uuid.UUID `json:"user_id"`
	Status              string    `json:"status"`
	StartTime           time.Time `json:"start_time"`
	EndTime             time.Time `json:"end_time"`
	Token               string    `json:"token"`
}

type UpdateStatusTransactionTryoutRequest struct {
	TryoutID uuid.UUID `json:"tryout_id"`
	UserID   uuid.UUID `json:"user_id"`
	Token    string    `json:"token"`
}

type TransactionTryoutResponse struct {
	TransactionTryoutID uuid.UUID `json:"transaction_tryout_id"`
	TryoutID            uuid.UUID `json:"tryout_id"`
	UserID              uuid.UUID `json:"user_id"`
	Status              string    `json:"status"`
	StartTime           time.Time `json:"start_time"`
	EndTime             time.Time `json:"end_time"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}
