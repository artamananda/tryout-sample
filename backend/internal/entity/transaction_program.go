package entity

import "github.com/google/uuid"

type TransactionProgram struct {
	TransactionProgramID uuid.UUID `json:"user_program_id"`
	UserID               uuid.UUID `json:"user_id"`
	ProgramID            uuid.UUID `json:"program_id"`
	Status               string    `json:"status"`
	Motivation           string    `json:"motivation"`
	CreatedAt            string    `json:"created_at"`
	UpdatedAt            string    `json:"updated_at"`
}

func (TransactionProgram) TableName() string {
	return "transaction_programs"
}
