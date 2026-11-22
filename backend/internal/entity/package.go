package entity

import (
	"time"

	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

// Package codes used by the TELISIK SKD program.
const (
	PackagePerdana   = "perdana"
	PackagePremium   = "premium"
	PackageUnggulan  = "unggulan"
	PackageEksekutif = "eksekutif"
	PackagePlatinum  = "platinum"
)

// Package is a purchasable bundle of a program (gelombang): tryouts, live
// classes, recordings and extras.
type Package struct {
	PackageID         uuid.UUID      `gorm:"primaryKey;default:gen_random_uuid()" json:"package_id"`
	ProgramID         uuid.UUID      `json:"program_id"`
	Code              string         `json:"code"`
	Name              string         `json:"name"`
	Description       string         `json:"description"`
	Price             int            `json:"price"`
	LaunchPrice       *int           `json:"launch_price"`
	LaunchPriceUntil  *time.Time     `json:"launch_price_until"`
	NormalValue       int            `json:"normal_value"`
	TryoutCount       int            `json:"tryout_count"`
	ClassCount        int            `json:"class_count"`
	RecordingDays     int            `json:"recording_days"`
	MentoringSessions int            `json:"mentoring_sessions"`
	HasExplanation    bool           `json:"has_explanation"`
	HasWeeklyReport   bool           `json:"has_weekly_report"`
	HasStudyGroup     bool           `json:"has_study_group"`
	HasCertificate    bool           `json:"has_certificate"`
	Features          pq.StringArray `gorm:"type:text[]" json:"features"`
	Quota             *int           `json:"quota"`
	Badge             string         `json:"badge"`
	TutorFeePercent   float64        `json:"tutor_fee_percent"`
	MentoringFee      int            `json:"mentoring_fee"`
	StudyGroupURL     string         `gorm:"column:study_group_url" json:"study_group_url"`
	HasGuarantee      bool           `json:"has_guarantee"`
	SortOrder         int            `json:"sort_order"`
	IsActive          bool           `json:"is_active"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

func (Package) TableName() string {
	return "packages"
}

// CurrentPrice is the launch price while it is valid, otherwise the normal price.
func (p Package) CurrentPrice(now time.Time) int {
	if p.LaunchPrice != nil && p.LaunchPriceUntil != nil && now.Before(*p.LaunchPriceUntil) {
		return *p.LaunchPrice
	}
	return p.Price
}

// IsFree reports whether the package costs nothing right now.
func (p Package) IsFree(now time.Time) bool {
	return p.CurrentPrice(now) == 0
}
