package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateTransactionProgramRequest struct {
	UserID     string `json:"user_id"`
	ProgramID  string `json:"program_id"`
	Status     string `json:"status"`
	Motivation string `json:"motivation"`
}

type TransactionProgramResponse struct {
	TransactionProgramID uuid.UUID `json:"user_program_id"`
	UserID               uuid.UUID `json:"user_id"`
	ProgramID            uuid.UUID `json:"program_id"`
	Status               string    `json:"status"`
	Motivation           string    `json:"motivation"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type FindAllTransactionProgramsRequest struct {
	UserID    string `json:"user_id"`
	ProgramID string `json:"program_id"`
}

type UpdateTransactionProgramRequest struct {
	TransactionProgramID string `json:"user_program_id"`
	UserID               string `json:"user_id"`
	ProgramID            string `json:"program_id"`
	Status               string `json:"status"`
	Motivation           string `json:"motivation"`
}
