package model

import "mime/multipart"

type RegisterProgramModel struct {
	UserID     string                `json:"user_id" validate:"required"`
	Name       string                `json:"name" validate:"required"`
	Email      string                `json:"email" validate:"required"`
	Grade      string                `json:"grade" validate:"required"`
	NISN       string                `json:"nisn" validate:"required"`
	School     string                `json:"school" validate:"required"`
	Regency    string                `json:"regency" validate:"required"`
	Province   string                `json:"province" validate:"required"`
	File       *multipart.FileHeader `json:"file" validate:"required"`
	Motivation string                `json:"motivation" validate:"required"`
	ProgramID  string                `json:"program_id" validate:"required"`
}
