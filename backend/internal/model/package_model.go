package model

import (
	"time"

	"github.com/google/uuid"
)

type CreatePackageRequest struct {
	ProgramID         uuid.UUID  `json:"program_id" validate:"required"`
	Code              string     `json:"code" validate:"required,max=30"`
	Name              string     `json:"name" validate:"required,max=100"`
	Description       string     `json:"description"`
	Price             int        `json:"price" validate:"min=0"`
	LaunchPrice       *int       `json:"launch_price" validate:"omitempty,min=0"`
	LaunchPriceUntil  *time.Time `json:"launch_price_until"`
	NormalValue       int        `json:"normal_value" validate:"min=0"`
	TryoutCount       int        `json:"tryout_count" validate:"min=0"`
	ClassCount        int        `json:"class_count" validate:"min=0"`
	RecordingDays     int        `json:"recording_days" validate:"min=0"`
	MentoringSessions int        `json:"mentoring_sessions" validate:"min=0"`
	HasExplanation    bool       `json:"has_explanation"`
	HasWeeklyReport   bool       `json:"has_weekly_report"`
	HasStudyGroup     bool       `json:"has_study_group"`
	HasCertificate    bool       `json:"has_certificate"`
	Features          []string   `json:"features"`
	Quota             *int       `json:"quota" validate:"omitempty,min=1"`
	Badge             string     `json:"badge" validate:"max=50"`
	SortOrder         int        `json:"sort_order"`
	IsActive          bool       `json:"is_active"`
	TutorFeePercent   float64    `json:"tutor_fee_percent" validate:"min=0,max=100"`
	MentoringFee      int        `json:"mentoring_fee" validate:"min=0"`
	StudyGroupURL     string     `json:"study_group_url" validate:"omitempty,url"`
	HasGuarantee      bool       `json:"has_guarantee"`
}

// UpdatePackageRequest changes only the fields present in the body.
// Send "clear_launch_price" or "clear_quota" to remove those values.
type UpdatePackageRequest struct {
	Code              *string    `json:"code" validate:"omitempty,max=30"`
	Name              *string    `json:"name" validate:"omitempty,max=100"`
	Description       *string    `json:"description"`
	Price             *int       `json:"price" validate:"omitempty,min=0"`
	LaunchPrice       *int       `json:"launch_price" validate:"omitempty,min=0"`
	LaunchPriceUntil  *time.Time `json:"launch_price_until"`
	ClearLaunchPrice  bool       `json:"clear_launch_price"`
	NormalValue       *int       `json:"normal_value" validate:"omitempty,min=0"`
	TryoutCount       *int       `json:"tryout_count" validate:"omitempty,min=0"`
	ClassCount        *int       `json:"class_count" validate:"omitempty,min=0"`
	RecordingDays     *int       `json:"recording_days" validate:"omitempty,min=0"`
	MentoringSessions *int       `json:"mentoring_sessions" validate:"omitempty,min=0"`
	HasExplanation    *bool      `json:"has_explanation"`
	HasWeeklyReport   *bool      `json:"has_weekly_report"`
	HasStudyGroup     *bool      `json:"has_study_group"`
	HasCertificate    *bool      `json:"has_certificate"`
	Features          *[]string  `json:"features"`
	Quota             *int       `json:"quota" validate:"omitempty,min=1"`
	ClearQuota        bool       `json:"clear_quota"`
	Badge             *string    `json:"badge" validate:"omitempty,max=50"`
	SortOrder         *int       `json:"sort_order"`
	IsActive          *bool      `json:"is_active"`
	TutorFeePercent   *float64   `json:"tutor_fee_percent" validate:"omitempty,min=0,max=100"`
	MentoringFee      *int       `json:"mentoring_fee" validate:"omitempty,min=0"`
	StudyGroupURL     *string    `json:"study_group_url"`
	HasGuarantee      *bool      `json:"has_guarantee"`
}

type PackageResponse struct {
	PackageID         uuid.UUID  `json:"package_id"`
	ProgramID         uuid.UUID  `json:"program_id"`
	Code              string     `json:"code"`
	Name              string     `json:"name"`
	Description       string     `json:"description"`
	Price             int        `json:"price"`
	LaunchPrice       *int       `json:"launch_price"`
	LaunchPriceUntil  *time.Time `json:"launch_price_until"`
	CurrentPrice      int        `json:"current_price"`
	IsLaunchPrice     bool       `json:"is_launch_price"`
	IsFree            bool       `json:"is_free"`
	PricePerSession   int        `json:"price_per_session"`
	NormalValue       int        `json:"normal_value"`
	SavingsPercent    int        `json:"savings_percent"`
	TryoutCount       int        `json:"tryout_count"`
	ClassCount        int        `json:"class_count"`
	RecordingDays     int        `json:"recording_days"`
	MentoringSessions int        `json:"mentoring_sessions"`
	HasExplanation    bool       `json:"has_explanation"`
	HasWeeklyReport   bool       `json:"has_weekly_report"`
	HasStudyGroup     bool       `json:"has_study_group"`
	HasCertificate    bool       `json:"has_certificate"`
	Features          []string   `json:"features"`
	Quota             *int       `json:"quota"`
	RemainingQuota    *int       `json:"remaining_quota"`
	IsSoldOut         bool       `json:"is_sold_out"`
	Badge             string     `json:"badge"`
	SortOrder         int        `json:"sort_order"`
	IsActive          bool       `json:"is_active"`
	HasGuarantee      bool       `json:"has_guarantee"`
	// Only for admins.
	TutorFeePercent *float64 `json:"tutor_fee_percent,omitempty"`
	MentoringFee    *int     `json:"mentoring_fee,omitempty"`
	// Only for admins and for the participants who own the package.
	StudyGroupURL string `json:"study_group_url,omitempty"`
	// Filled for a logged-in participant.
	IsOwned     bool `json:"is_owned"`
	IsUpgrade   bool `json:"is_upgrade"`
	CanPurchase bool `json:"can_purchase"`
	// UpgradePrice is what the owner pays to move to this package now
	// (Paket Tambah: the difference within the upgrade window).
	UpgradePrice *int `json:"upgrade_price,omitempty"`
}

type ProgramPackagesResponse struct {
	Program            ProgramResponse   `json:"program"`
	IsRegistrationOpen bool              `json:"is_registration_open"`
	OwnedPackageID     *uuid.UUID        `json:"owned_package_id"`
	Packages           []PackageResponse `json:"packages"`
}
