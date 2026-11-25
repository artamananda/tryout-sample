package service

import (
	"testing"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestUserBadgesOf(t *testing.T) {
	birth := time.Date(2000, 1, 2, 0, 0, 0, 0, time.UTC)
	complete := entity.User{
		Name: "Ani", PhoneNumber: "6281234567890", Gender: "female", BirthDate: &birth,
		LastEducation: "S1", Province: "Jawa Barat", Regency: "Bandung", TargetAgency: "Kemenkeu",
	}

	badges := UserBadgesOf(complete, nil)
	assert.True(t, badges.ProfileComplete)
	assert.Empty(t, badges.ProfileMissing)
	assert.Nil(t, badges.Verified, "the blue check is never automatic")
	assert.Nil(t, badges.Package)

	partial := complete
	partial.PhoneNumber = " "
	partial.BirthDate = nil
	badges = UserBadgesOf(partial, nil)
	assert.False(t, badges.ProfileComplete)
	assert.Equal(t, []string{"phone_number", "birth_date"}, badges.ProfileMissing)

	label := "tutor"
	verifiedAt := time.Date(2026, 11, 25, 10, 0, 0, 0, time.UTC)
	tutor := complete
	tutor.VerifiedLabel = &label
	tutor.VerifiedAt = &verifiedAt
	badges = UserBadgesOf(tutor, &model.PackageBadge{Code: "platinum", Name: "Platinum"})
	assert.Equal(t, &model.VerifiedBadge{Label: "tutor", LabelName: "Tutor", VerifiedAt: verifiedAt}, badges.Verified)
	assert.Equal(t, "platinum", badges.Package.Code)
}
