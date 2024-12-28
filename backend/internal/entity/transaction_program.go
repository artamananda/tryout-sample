package entity

import (
	"time"

	"github.com/google/uuid"
)

type TransactionProgram struct {
	TransactionProgramID uuid.UUID `json:"user_program_id"`
	UserID               uuid.UUID `json:"user_id"`
	User                 User      `json:"user" gorm:"foreignKey:UserID;references:UserID"`
	ProgramID            uuid.UUID `json:"program_id"`
	Program              Program   `json:"program" gorm:"foreignKey:ProgramID;references:ProgramID"`
	Status               string    `json:"status"`
	Motivation           string    `json:"motivation"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (TransactionProgram) TableName() string {
	return "transaction_programs"
}
