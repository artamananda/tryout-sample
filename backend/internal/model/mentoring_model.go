package model

import (
	"time"

	"github.com/google/uuid"
)

// CreateMentoringSlotsRequest creates one slot per tutor, date and time.
// Times are "HH:MM" in WIB.
type CreateMentoringSlotsRequest struct {
	ProgramID       uuid.UUID `json:"program_id" validate:"required"`
	Dates           []string  `json:"dates" validate:"required,min=1,dive,datetime=2006-01-02"`
	Times           []string  `json:"times" validate:"required,min=1,dive,datetime=15:04"`
	Tutors          []string  `json:"tutors" validate:"required,min=1,dive,required,max=100"`
	DurationMinutes int       `json:"duration_minutes" validate:"required,min=10,max=180"`
	MeetingURL      string    `json:"meeting_url" validate:"omitempty,url"`
}

type UpdateMentoringSlotRequest struct {
	Status     *string `json:"status" validate:"omitempty,oneof=OPEN BOOKED DONE NO_SHOW CANCELLED"`
	MeetingURL *string `json:"meeting_url"`
	Notes      *string `json:"notes"`
}

type MentoringSlotResponse struct {
	SlotID          uuid.UUID `json:"slot_id"`
	ProgramID       uuid.UUID `json:"program_id"`
	TutorName       string    `json:"tutor_name"`
	StartsAt        time.Time `json:"starts_at"`
	DurationMinutes int       `json:"duration_minutes"`
	Status          string    `json:"status"`
	IsMine          bool      `json:"is_mine"`
	CanCancel       bool      `json:"can_cancel"`
	MeetingURL      string    `json:"meeting_url,omitempty"`
	Notes           string    `json:"notes,omitempty"`
	// Admin view.
	BookedBy *OrderUserSummary `json:"booked_by,omitempty"`
}

type MentoringOverviewResponse struct {
	Allowed   int                     `json:"allowed"`
	Used      int                     `json:"used"`
	Remaining int                     `json:"remaining"`
	Slots     []MentoringSlotResponse `json:"slots"`
}
