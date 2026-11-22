package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateLiveClassRequest struct {
	ProgramID    uuid.UUID  `json:"program_id" validate:"required"`
	Sequence     int        `json:"sequence" validate:"required,min=1"`
	Title        string     `json:"title" validate:"required,max=150"`
	Description  string     `json:"description"`
	TryoutID     *uuid.UUID `json:"tryout_id"`
	TutorName    string     `json:"tutor_name" validate:"max=100"`
	StartsAt     time.Time  `json:"starts_at" validate:"required"`
	EndsAt       time.Time  `json:"ends_at" validate:"required"`
	MeetingURL   string     `json:"meeting_url" validate:"omitempty,url"`
	RecordingURL string     `json:"recording_url" validate:"omitempty,url"`
}

type UpdateLiveClassRequest struct {
	Sequence     *int       `json:"sequence" validate:"omitempty,min=1"`
	Title        *string    `json:"title" validate:"omitempty,max=150"`
	Description  *string    `json:"description"`
	TryoutID     *uuid.UUID `json:"tryout_id"`
	ClearTryout  bool       `json:"clear_tryout"`
	TutorName    *string    `json:"tutor_name" validate:"omitempty,max=100"`
	StartsAt     *time.Time `json:"starts_at"`
	EndsAt       *time.Time `json:"ends_at"`
	MeetingURL   *string    `json:"meeting_url"`
	RecordingURL *string    `json:"recording_url"`
}

type RateLiveClassRequest struct {
	Rating  int    `json:"rating" validate:"required,min=1,max=5"`
	Comment string `json:"comment" validate:"max=1000"`
}

// LiveClassResponse is one class. For participants, the meeting link and the
// recording are only filled while they may use them.
type LiveClassResponse struct {
	ClassID     uuid.UUID  `json:"class_id"`
	ProgramID   uuid.UUID  `json:"program_id"`
	Sequence    int        `json:"sequence"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	TryoutID    *uuid.UUID `json:"tryout_id"`
	TutorName   string     `json:"tutor_name"`
	StartsAt    time.Time  `json:"starts_at"`
	EndsAt      time.Time  `json:"ends_at"`
	Status      string     `json:"status"`

	MeetingURL   string `json:"meeting_url,omitempty"`
	RecordingURL string `json:"recording_url,omitempty"`

	// Participant view.
	HasAccess          bool       `json:"has_access"`
	LockedReason       string     `json:"locked_reason,omitempty"`
	CanJoin            bool       `json:"can_join"`
	JoinOpensAt        time.Time  `json:"join_opens_at"`
	HasRecording       bool       `json:"has_recording"`
	RecordingExpiresAt *time.Time `json:"recording_expires_at,omitempty"`
	Attended           bool       `json:"attended"`
	MyRating           int        `json:"my_rating,omitempty"`
	CanRate            bool       `json:"can_rate"`

	// Admin view.
	Attendees   *int     `json:"attendees,omitempty"`
	RatingCount *int     `json:"rating_count,omitempty"`
	RatingAvg   *float64 `json:"rating_avg,omitempty"`
}
