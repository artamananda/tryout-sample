package model

import (
	"time"

	"github.com/google/uuid"
)

type ReferralInfoResponse struct {
	Code             string `json:"code"`
	DiscountAmount   int    `json:"discount_amount"`
	BonusPerReferral int    `json:"bonus_tryouts_per_referral"`
	PaidReferrals    int    `json:"paid_referrals"`
	BonusEarned      int    `json:"bonus_tryouts_earned"`
}

// ProgramProgressResponse is the participant's progress in one program,
// with guarantee and certificate status.
type ProgramProgressResponse struct {
	ProgramID      uuid.UUID           `json:"program_id"`
	ProgramName    string              `json:"program_name"`
	PackageName    string              `json:"package_name"`
	TryoutLimit    int                 `json:"tryout_limit"`
	Tryouts        []SKDTryoutProgress `json:"tryouts"`
	CompletedCount int                 `json:"completed_count"`
	AllCompleted   bool                `json:"all_completed"`
	StudyGroupURL  string              `json:"study_group_url,omitempty"`
	Guarantee      *GuaranteeStatus    `json:"guarantee,omitempty"`
	Certificate    *CertificateStatus  `json:"certificate,omitempty"`
}

type GuaranteeStatus struct {
	Included   bool   `json:"included"`
	Eligible   bool   `json:"eligible"`
	Reason     string `json:"reason"`
	FirstScore int    `json:"first_score"`
	LastScore  int    `json:"last_score"`
	// ClaimStatus is empty when no claim was made.
	ClaimStatus string `json:"claim_status,omitempty"`
}

type CertificateStatus struct {
	Included          bool       `json:"included"`
	Eligible          bool       `json:"eligible"`
	Reason            string     `json:"reason"`
	CertificateNumber string     `json:"certificate_number,omitempty"`
	IssuedAt          *time.Time `json:"issued_at,omitempty"`
}

type CertificateResponse struct {
	CertificateNumber string    `json:"certificate_number"`
	ParticipantName   string    `json:"participant_name"`
	ProgramName       string    `json:"program_name"`
	PackageName       string    `json:"package_name"`
	BestScore         int       `json:"best_score"`
	TryoutsCompleted  int       `json:"tryouts_completed"`
	IssuedAt          time.Time `json:"issued_at"`
}

type GuaranteeClaimResponse struct {
	ClaimID         uuid.UUID         `json:"claim_id"`
	User            *OrderUserSummary `json:"user,omitempty"`
	ProgramID       uuid.UUID         `json:"program_id"`
	PackageID       uuid.UUID         `json:"package_id"`
	FirstScore      int               `json:"first_score"`
	LastScore       int               `json:"last_score"`
	Status          string            `json:"status"`
	TargetProgramID *uuid.UUID        `json:"target_program_id,omitempty"`
	AdminNote       string            `json:"admin_note,omitempty"`
	CreatedAt       time.Time         `json:"created_at"`
}

type ReviewGuaranteeRequest struct {
	Approve         bool       `json:"approve"`
	TargetProgramID *uuid.UUID `json:"target_program_id"`
	AdminNote       string     `json:"admin_note" validate:"max=1000"`
}

// MyProgramResponse is one program the participant belongs to.
type MyProgramResponse struct {
	ProgramID         uuid.UUID `json:"program_id"`
	ProgramName       string    `json:"program_name"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
	PackageName       string    `json:"package_name"`
	PackageCode       string    `json:"package_code"`
	TryoutLimit       int       `json:"tryout_limit"`
	ClassCount        int       `json:"class_count"`
	MentoringSessions int       `json:"mentoring_sessions"`
	HasGuarantee      bool      `json:"has_guarantee"`
	HasCertificate    bool      `json:"has_certificate"`
}
