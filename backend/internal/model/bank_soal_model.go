package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateBankSoalRequest struct {
	Type          string   `json:"type" validate:"required"`
	Text          string   `json:"text" validate:"required"`
	ImageUrl      string   `json:"image_url"`
	IsOptions     *bool    `json:"is_options"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer" validate:"required"`
	Explanation   string   `json:"explanation"`
	Difficulty    string   `json:"difficulty"`
	Topic         string   `json:"topic"`
	Points        int      `json:"points"`
	IsAIGenerated bool     `json:"is_ai_generated"`
}

type CreateBankSoalBatchRequest struct {
	Questions []CreateBankSoalRequest `json:"questions" validate:"required,dive"`
}

type UpdateBankSoalRequest struct {
	Type          string   `json:"type"`
	Text          string   `json:"text"`
	ImageUrl      string   `json:"image_url"`
	IsOptions     *bool    `json:"is_options"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
	Difficulty    string   `json:"difficulty"`
	Topic         string   `json:"topic"`
	Points        int      `json:"points"`
}

type BankSoalResponse struct {
	BankSoalID    uuid.UUID `json:"bank_soal_id"`
	Type          string    `json:"type"`
	Text          string    `json:"text"`
	ImageUrl      string    `json:"image_url"`
	IsOptions     *bool     `json:"is_options"`
	Options       []string  `json:"options"`
	CorrectAnswer string    `json:"correct_answer"`
	Explanation   string    `json:"explanation"`
	Difficulty    string    `json:"difficulty"`
	Topic         string    `json:"topic"`
	Points        int       `json:"points"`
	IsAIGenerated bool      `json:"is_ai_generated"`
	CreatedBy     uuid.UUID `json:"created_by"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
