package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateTryoutRequest struct {
	Title     string    `json:"title" validate:"required"`
	Duration  int       `json:"duration" validate:"required,min=1"`
	StartTime time.Time `json:"start_time" validate:"required"`
	EndTime   time.Time `json:"end_time" validate:"required"`
}

type UpdateTryoutRequest struct {
	Title     string    `json:"title"`
	Duration  int       `json:"duration"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
}

type TryoutResponse struct {
	TryoutID  uuid.UUID `json:"tryout_id"`
	Title     string    `json:"title"`
	Duration  int       `json:"duration"`
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
