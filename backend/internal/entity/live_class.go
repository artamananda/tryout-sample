package entity

import (
	"time"

	"github.com/google/uuid"
)

// LiveClass is a scheduled live discussion class of a program.
type LiveClass struct {
	ClassID      uuid.UUID  `gorm:"primaryKey;default:gen_random_uuid()" json:"class_id"`
	ProgramID    uuid.UUID  `json:"program_id"`
	Sequence     int        `json:"sequence"`
	Title        string     `json:"title"`
	Description  string     `json:"description"`
	TryoutID     *uuid.UUID `json:"tryout_id"`
	TutorName    string     `json:"tutor_name"`
	StartsAt     time.Time  `json:"starts_at"`
	EndsAt       time.Time  `json:"ends_at"`
	MeetingURL   string     `gorm:"column:meeting_url" json:"meeting_url"`
	RecordingURL string     `gorm:"column:recording_url" json:"recording_url"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (LiveClass) TableName() string { return "live_classes" }

type LiveClassAttendance struct {
	ClassID  uuid.UUID `gorm:"primaryKey" json:"class_id"`
	UserID   uuid.UUID `gorm:"primaryKey" json:"user_id"`
	JoinedAt time.Time `json:"joined_at"`
}

func (LiveClassAttendance) TableName() string { return "live_class_attendances" }

type LiveClassRating struct {
	ClassID   uuid.UUID `gorm:"primaryKey" json:"class_id"`
	UserID    uuid.UUID `gorm:"primaryKey" json:"user_id"`
	Rating    int       `json:"rating"`
	Comment   string    `json:"comment"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (LiveClassRating) TableName() string { return "live_class_ratings" }

// Mentoring slot statuses.
const (
	SlotOpen      = "OPEN"
	SlotBooked    = "BOOKED"
	SlotDone      = "DONE"
	SlotNoShow    = "NO_SHOW"
	SlotCancelled = "CANCELLED"
)

// MentoringSlot is one 1:1 mentoring session that a participant can book.
type MentoringSlot struct {
	SlotID          uuid.UUID  `gorm:"primaryKey;default:gen_random_uuid()" json:"slot_id"`
	ProgramID       uuid.UUID  `json:"program_id"`
	TutorName       string     `json:"tutor_name"`
	StartsAt        time.Time  `json:"starts_at"`
	DurationMinutes int        `json:"duration_minutes"`
	MeetingURL      string     `gorm:"column:meeting_url" json:"meeting_url"`
	Status          string     `json:"status"`
	BookedBy        *uuid.UUID `json:"booked_by"`
	BookedAt        *time.Time `json:"booked_at"`
	Notes           string     `json:"notes"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (MentoringSlot) TableName() string { return "mentoring_slots" }
