package entity

import (
	"time"

	"github.com/google/uuid"
)

// ReferralReward records the bonus given to a referrer for one paid order.
type ReferralReward struct {
	OrderID        uuid.UUID `gorm:"primaryKey" json:"order_id"`
	ReferrerUserID uuid.UUID `json:"referrer_user_id"`
	ProgramID      uuid.UUID `json:"program_id"`
	BonusTryouts   int       `json:"bonus_tryouts"`
	Note           string    `json:"note"`
	CreatedAt      time.Time `json:"created_at"`
}

func (ReferralReward) TableName() string { return "referral_rewards" }

type WeeklyReportLog struct {
	UserID    uuid.UUID `gorm:"primaryKey" json:"user_id"`
	ProgramID uuid.UUID `gorm:"primaryKey" json:"program_id"`
	WeekStart time.Time `gorm:"primaryKey;type:date" json:"week_start"`
	Status    string    `json:"status"`
	Error     string    `json:"error"`
	SentAt    time.Time `json:"sent_at"`
}

func (WeeklyReportLog) TableName() string { return "weekly_report_logs" }

// Guarantee claim statuses.
const (
	GuaranteePending  = "PENDING"
	GuaranteeApproved = "APPROVED"
	GuaranteeRejected = "REJECTED"
)

type GuaranteeClaim struct {
	ClaimID         uuid.UUID  `gorm:"primaryKey;default:gen_random_uuid()" json:"claim_id"`
	UserID          uuid.UUID  `json:"user_id"`
	User            User       `gorm:"foreignKey:UserID;references:UserID" json:"-"`
	ProgramID       uuid.UUID  `json:"program_id"`
	PackageID       uuid.UUID  `json:"package_id"`
	FirstScore      int        `json:"first_score"`
	LastScore       int        `json:"last_score"`
	Status          string     `json:"status"`
	TargetProgramID *uuid.UUID `json:"target_program_id"`
	AdminNote       string     `json:"admin_note"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (GuaranteeClaim) TableName() string { return "guarantee_claims" }

type Certificate struct {
	CertificateID     uuid.UUID `gorm:"primaryKey;default:gen_random_uuid()" json:"certificate_id"`
	CertificateNumber string    `json:"certificate_number"`
	UserID            uuid.UUID `json:"user_id"`
	ProgramID         uuid.UUID `json:"program_id"`
	PackageID         uuid.UUID `json:"package_id"`
	BestScore         int       `json:"best_score"`
	TryoutsCompleted  int       `json:"tryouts_completed"`
	IssuedAt          time.Time `json:"issued_at"`
}

func (Certificate) TableName() string { return "certificates" }
