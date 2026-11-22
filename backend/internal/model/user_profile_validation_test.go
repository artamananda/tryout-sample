package model_test

import (
	"testing"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/stretchr/testify/assert"
)

func ptr(value string) *string { return &value }

func TestProfileFieldsValidation(t *testing.T) {
	t.Run("absent fields are valid", func(t *testing.T) {
		assert.NoError(t, common.Validate(model.UpdateMyProfileRequest{}))
	})

	t.Run("empty strings are valid so fields can be cleared", func(t *testing.T) {
		request := model.UpdateMyProfileRequest{ProfileFields: model.ProfileFields{
			Gender:        ptr(""),
			BirthDate:     ptr(""),
			LastEducation: ptr(""),
		}}
		assert.NoError(t, common.Validate(request))
	})

	t.Run("valid values pass", func(t *testing.T) {
		request := model.UpdateMyProfileRequest{ProfileFields: model.ProfileFields{
			Gender:        ptr("female"),
			BirthDate:     ptr("2000-05-17"),
			LastEducation: ptr("SMA/SMK"),
		}}
		assert.NoError(t, common.Validate(request))
	})

	t.Run("values longer than the column are rejected", func(t *testing.T) {
		for name, fields := range map[string]model.ProfileFields{
			"nisn":       {NISN: ptr("12345678901")},
			"grade":      {Grade: ptr("12345678901")},
			"birth date": {BirthDate: ptr("2000-05-17T00:00")},
		} {
			err := common.Validate(model.UpdateMyProfileRequest{ProfileFields: fields})
			assert.Error(t, err, name)
		}
	})

	t.Run("admin cannot set an unknown role", func(t *testing.T) {
		assert.Error(t, common.Validate(model.UpdateUserRequest{Role: ptr("superadmin")}))
		assert.NoError(t, common.Validate(model.UpdateUserRequest{Role: ptr("admin")}))
	})
}
