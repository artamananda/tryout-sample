package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateTryoutRequest struct {
	ProgramID            *uuid.UUID                        `json:"program_id"`
	Title                string                            `json:"title" validate:"required"`
	Duration             int                               `json:"duration" validate:"required,min=1"`
	StartTime            time.Time                         `json:"start_time" validate:"required"`
	EndTime              time.Time                         `json:"end_time" validate:"required"`
	IsPublished          bool                              `json:"is_published" validate:"required"`
	ShowScore            bool                              `json:"show_score"`
	GenerateFromBankSoal bool                              `json:"generate_from_bank_soal"`
	BankSoalDistribution []CreateTryoutBankSoalItemRequest `json:"bank_soal_distribution"`
}

type CreateTryoutBankSoalItemRequest struct {
	Type  string `json:"type" validate:"required"`
	Count int    `json:"count" validate:"required,min=1"`
}

type FindAllTryoutRequest struct {
	Search      string `json:"search"`
	IsPublished *bool  `json:"is_published"`
}

type UpdateTryoutRequest struct {
	ProgramID   *uuid.UUID `json:"program_id"`
	Title       *string    `json:"title"`
	Duration    *int       `json:"duration"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	IsPublished *bool      `json:"is_published"`
	ShowScore   *bool      `json:"show_score"`
}

type TryoutResponse struct {
	TryoutID               uuid.UUID  `json:"tryout_id"`
	ProgramID              *uuid.UUID `json:"program_id"`
	Title                  string     `json:"title"`
	Duration               int        `json:"duration"`
	StartTime              time.Time  `json:"start_time"`
	EndTime                time.Time  `json:"end_time"`
	Token                  string     `json:"token"`
	IsPublished            bool       `json:"is_published"`
	ShowScore              bool       `json:"show_score"`
	GeneratedQuestionCount int        `json:"generated_question_count,omitempty"`
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
}
