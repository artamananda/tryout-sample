package service

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func newUserServiceWithMock(t *testing.T) (*UserService, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	t.Cleanup(func() { db.Close() })

	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{})
	assert.NoError(t, err)

	repo := repository.NewUserRepository(gormDB)
	service := NewUserService(&repo, nil)
	return &service, mock
}

func expectFindUser(mock sqlmock.Sqlmock, userID uuid.UUID, phone string, password string) {
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE user_id = $1`)).
		WithArgs(userID.String(), 1).
		WillReturnRows(sqlmock.NewRows([]string{"user_id", "username", "name", "email", "role", "phone_number", "password"}).
			AddRow(userID, "peserta", "Peserta", "peserta@example.com", "user", phone, password))
}

func strPtr(value string) *string { return &value }

func TestUserService_UpdateProfileNormalizesPhoneNumber(t *testing.T) {
	service, mock := newUserServiceWithMock(t)
	userID := uuid.New()

	expectFindUser(mock, userID, "", "")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users" WHERE phone_number = $1 AND user_id <> $2`)).
		WithArgs("6281234567890", userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "users" SET`)).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()
	expectFindUser(mock, userID, "6281234567890", "")

	result, err := service.UpdateProfile(context.Background(), userID.String(), model.UpdateMyProfileRequest{
		ProfileFields: model.ProfileFields{PhoneNumber: strPtr("0812-3456-7890")},
	})
	assert.NoError(t, err)
	assert.Equal(t, "6281234567890", result.PhoneNumber)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserService_UpdateProfileRejectsTakenPhoneNumber(t *testing.T) {
	service, mock := newUserServiceWithMock(t)
	userID := uuid.New()

	expectFindUser(mock, userID, "", "")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users" WHERE phone_number = $1 AND user_id <> $2`)).
		WithArgs("6281234567890", userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	_, err := service.UpdateProfile(context.Background(), userID.String(), model.UpdateMyProfileRequest{
		ProfileFields: model.ProfileFields{PhoneNumber: strPtr("081234567890")},
	})
	assert.IsType(t, exception.BadRequestError{}, err)
	assert.NoError(t, mock.ExpectationsWereMet(), "nothing is written")
}

func TestUserService_UpdateProfileRejectsInvalidValues(t *testing.T) {
	cases := map[string]model.ProfileFields{
		"gender":         {Gender: strPtr("x")},
		"last education": {LastEducation: strPtr("SD")},
		"birth date":     {BirthDate: strPtr("2000-13-45")},
		"short username": {Username: strPtr("ab")},
		"bad username":   {Username: strPtr("nama saya")},
		"empty name":     {Name: strPtr("  ")},
		"phone":          {PhoneNumber: strPtr("12345")},
	}
	for name, fields := range cases {
		t.Run(name, func(t *testing.T) {
			service, mock := newUserServiceWithMock(t)
			userID := uuid.New()
			expectFindUser(mock, userID, "", "")

			_, err := service.UpdateProfile(context.Background(), userID.String(), model.UpdateMyProfileRequest{ProfileFields: fields})
			assert.IsType(t, exception.BadRequestError{}, err)
			assert.NoError(t, mock.ExpectationsWereMet(), "nothing is written")
		})
	}
}

func TestUserService_ChangePasswordChecksOldPassword(t *testing.T) {
	service, mock := newUserServiceWithMock(t)
	userID := uuid.New()
	hashed, _ := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.MinCost)

	expectFindUser(mock, userID, "", string(hashed))

	err := service.ChangePassword(context.Background(), userID.String(), model.ChangePasswordRequest{
		OldPassword: "salah",
		NewPassword: "rahasiabaru",
	})
	assert.EqualError(t, err, "password lama tidak sesuai")
	assert.NoError(t, mock.ExpectationsWereMet(), "nothing is written")
}

func TestUserService_ChangePasswordUpdatesHash(t *testing.T) {
	service, mock := newUserServiceWithMock(t)
	userID := uuid.New()
	hashed, _ := bcrypt.GenerateFromPassword([]byte("rahasia123"), bcrypt.MinCost)

	expectFindUser(mock, userID, "", string(hashed))
	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "users" SET "password"=$1,"updated_at"=$2 WHERE user_id = $3`)).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := service.ChangePassword(context.Background(), userID.String(), model.ChangePasswordRequest{
		OldPassword: "rahasia123",
		NewPassword: "rahasiabaru",
	})
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}
