package service

import (
	"strings"
	"testing"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUpgradePrice(t *testing.T) {
	now := time.Now()
	unggulan := entity.Package{Price: 149000}
	paidYesterday := now.Add(-24 * time.Hour)
	paidLongAgo := now.Add(-8 * 24 * time.Hour)

	assert.Equal(t, 99000, UpgradePrice(unggulan, repository.PaidSummary{Total: 50000, LastPaidAt: &paidYesterday}, now),
		"Premium to Unggulan within 7 days pays the Rp99.000 difference")
	assert.Equal(t, 149000, UpgradePrice(unggulan, repository.PaidSummary{Total: 50000, LastPaidAt: &paidLongAgo}, now),
		"after the window the full price applies")
	assert.Equal(t, 149000, UpgradePrice(unggulan, repository.PaidSummary{}, now), "free Perdana pays the full price")
	assert.Equal(t, 0, UpgradePrice(unggulan, repository.PaidSummary{Total: 200000, LastPaidAt: &paidYesterday}, now))
}

func TestEvaluateClass(t *testing.T) {
	programID := uuid.New()
	start := time.Date(2026, 11, 30, 12, 45, 0, 0, time.UTC)
	class := entity.LiveClass{ProgramID: programID, Sequence: 6, StartsAt: start}
	unggulan := entity.Package{Name: "Unggulan", ClassCount: 5, RecordingDays: 30}
	eksekutif := entity.Package{Name: "Eksekutif", ClassCount: 10, RecordingDays: 60}
	premium := entity.Package{Name: "Premium", ClassCount: 0}

	assert.False(t, EvaluateClass(class, map[uuid.UUID]Membership{}).HasAccess)
	locked := EvaluateClass(class, map[uuid.UUID]Membership{programID: {Package: &unggulan}})
	assert.False(t, locked.HasAccess, "Unggulan covers classes 1-5")
	assert.Contains(t, EvaluateClass(class, map[uuid.UUID]Membership{programID: {Package: &premium}}).Reason, "belum termasuk kelas")

	access := EvaluateClass(class, map[uuid.UUID]Membership{programID: {Package: &eksekutif}})
	assert.True(t, access.HasAccess)
	assert.Equal(t, start.AddDate(0, 0, 60), *access.RecordingExpiresAt, "recording lasts 60 days after the class")

	legacy := EvaluateClass(class, map[uuid.UUID]Membership{programID: {}})
	assert.True(t, legacy.HasAccess)
	assert.Nil(t, legacy.RecordingExpiresAt)
}

func TestComputeClassFeeMatchesBusinessPlan(t *testing.T) {
	unggulan := entity.Package{ClassCount: 5, TutorFeePercent: 35}
	eksekutif := entity.Package{ClassCount: 10, TutorFeePercent: 33}
	platinum := entity.Package{ClassCount: 10, TutorFeePercent: 33}
	premium := entity.Package{ClassCount: 0, TutorFeePercent: 15}

	gross, n := ComputeClassFee(1, []paidMember{{Paid: 149000, Package: unggulan}})
	assert.Equal(t, 1, n)
	assert.InDelta(t, 10430, gross, 0.5, "Unggulan: Rp10.430 per participant per class")

	gross, _ = ComputeClassFee(1, []paidMember{{Paid: 279000, Package: eksekutif}})
	assert.InDelta(t, 9207, gross, 0.5, "Eksekutif: Rp9.207")

	gross, _ = ComputeClassFee(1, []paidMember{{Paid: 449000, Package: platinum}})
	assert.InDelta(t, 14817, gross, 0.5, "Platinum: Rp14.817")

	members := []paidMember{}
	for i := 0; i < 20; i++ {
		members = append(members, paidMember{Paid: 279000, Package: eksekutif})
	}
	gross, _ = ComputeClassFee(1, members)
	assert.InDelta(t, 184140, gross, 1, "20 Eksekutif participants = Rp184.140 (raised to the Rp200.000 minimum)")

	gross, n = ComputeClassFee(6, []paidMember{{Paid: 149000, Package: unggulan}, {Paid: 50000, Package: premium}})
	assert.Zero(t, n, "class 6 is outside Unggulan; Premium has no classes")
	assert.Zero(t, gross)
}

func TestWeekStartIsMondayWIB(t *testing.T) {
	sunday := time.Date(2026, 12, 6, 12, 0, 0, 0, time.UTC) // Sunday 19:00 WIB
	assert.Equal(t, "2026-11-30", weekStart(sunday).Format("2006-01-02"))
	mondayEarlyWIB := time.Date(2026, 11, 29, 18, 0, 0, 0, time.UTC) // Monday 01:00 WIB
	assert.Equal(t, "2026-11-30", weekStart(mondayEarlyWIB).Format("2006-01-02"))
}

func TestRandomCode(t *testing.T) {
	seen := map[string]bool{}
	for i := 0; i < 200; i++ {
		code, err := randomCode(8)
		assert.NoError(t, err)
		assert.Len(t, code, 8)
		assert.False(t, strings.ContainsAny(code, "01OIL"), "no look-alike characters")
		seen[code] = true
	}
	assert.Greater(t, len(seen), 195)
}

func TestMembershipTryoutLimit(t *testing.T) {
	premium := entity.Package{TryoutCount: 5}
	assert.Equal(t, 6, Membership{Package: &premium, BonusTryouts: 1}.TryoutLimit(), "referral bonus opens one more TO")
	assert.Equal(t, 0, Membership{}.TryoutLimit(), "legacy registrations have no limit")
}
