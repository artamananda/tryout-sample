package model

import "mime/multipart"

type Batch5Model struct {
	Name       string                `json:"name" validate:"required"`
	Email      string                `json:"email" validate:"required"`
	Grade      string                `json:"grade" validate:"required"`
	School     string                `json:"school" validate:"required"`
	Regency    string                `json:"regency" validate:"required"`
	Province   string                `json:"province" validate:"required"`
	File       *multipart.FileHeader `json:"file" validate:"required"`
	Motivation string                `json:"motivation" validate:"required"`
	ProgramID  string                `json:"program_id" validate:"required"`
}
