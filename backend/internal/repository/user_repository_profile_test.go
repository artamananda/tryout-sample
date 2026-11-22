package repository

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestUserRepository_CreateRejectsExistingAccount(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()
	repo := NewUserRepository(db)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users" WHERE LOWER(email) = $1 OR LOWER(username) = $2`)).
		WithArgs("taken@example.com", "taken").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	user, err := repo.Create(context.Background(), entity.User{Email: "Taken@Example.com", Username: "Taken"})
	assert.ErrorIs(t, err, ErrAccountAlreadyExists)
	assert.Equal(t, uuid.Nil, user.UserID)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_FindAccountIsExistWithoutUsername(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()
	repo := NewUserRepository(db)

	// An empty username must not match every user that has an empty username.
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users" WHERE LOWER(email) = $1`)).
		WithArgs("new@example.com").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	assert.False(t, repo.FindAccountIsExist(context.Background(), "new@example.com", ""))
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_FindByIdRejectsInvalidID(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()
	repo := NewUserRepository(db)

	_, err := repo.FindById(context.Background(), "not-a-uuid")
	assert.EqualError(t, err, "user Not Found")
	assert.NoError(t, mock.ExpectationsWereMet(), "no query is sent for an invalid id")
}

func TestUserRepository_UpdateFieldsWritesEmptyValues(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()
	repo := NewUserRepository(db)
	userID := uuid.New()

	mock.ExpectBegin()
	mock.ExpectExec(regexp.QuoteMeta(`UPDATE "users" SET "major"=$1,"phone_number"=$2,"updated_at"=$3 WHERE user_id = $4`)).
		WithArgs("", nil, sqlmock.AnyArg(), userID).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectCommit()

	err := repo.UpdateFields(context.Background(), userID, map[string]interface{}{
		"major":        "",
		"phone_number": nil,
	})
	assert.NoError(t, err)
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestUserRepository_IsPhoneNumberTaken(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()
	repo := NewUserRepository(db)
	userID := uuid.New()

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users" WHERE phone_number = $1 AND user_id <> $2`)).
		WithArgs("6281234567890", userID).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	assert.True(t, repo.IsPhoneNumberTaken(context.Background(), "6281234567890", userID))
	assert.NoError(t, mock.ExpectationsWereMet())
}
