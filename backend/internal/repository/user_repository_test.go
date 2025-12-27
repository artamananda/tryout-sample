package repository

import (
	"context"
	"errors"
	"regexp"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupMockDB(t *testing.T) (*gorm.DB, sqlmock.Sqlmock, func()) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn: db,
	}), &gorm.Config{})
	assert.NoError(t, err)

	cleanup := func() {
		db.Close()
	}

	return gormDB, mock, cleanup
}

func TestUserRepository_FindById(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	userId := uuid.New().String()
	ctx := context.Background()

	t.Run("finds user successfully", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "username", "email", "name"}).
			AddRow(userId, "testuser", "test@example.com", "Test User")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE user_id = $1`)).
			WithArgs(userId).
			WillReturnRows(rows)

		user, err := repo.FindById(ctx, userId)
		assert.NoError(t, err)
		assert.Equal(t, userId, user.UserID.String())
		assert.Equal(t, "testuser", user.Username)
	})

	t.Run("returns error when user not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE user_id = $1`)).
			WithArgs(userId).
			WillReturnRows(sqlmock.NewRows([]string{}))

		user, err := repo.FindById(ctx, userId)
		assert.Error(t, err)
		assert.Equal(t, "user Not Found", err.Error())
		assert.Equal(t, uuid.Nil, user.UserID)
	})
}

func TestUserRepository_FindByEmail(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()
	email := "test@example.com"
	userId := uuid.New()

	t.Run("finds user by email successfully", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "username", "email", "name"}).
			AddRow(userId, "testuser", email, "Test User")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1`)).
			WithArgs(email).
			WillReturnRows(rows)

		user, err := repo.FindByEmail(ctx, email)
		assert.NoError(t, err)
		assert.Equal(t, email, user.Email)
	})

	t.Run("returns error when user not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1`)).
			WithArgs(email).
			WillReturnRows(sqlmock.NewRows([]string{}))

		user, err := repo.FindByEmail(ctx, email)
		assert.Error(t, err)
		assert.Equal(t, "user Not Found", err.Error())
		assert.Empty(t, user.Email)
	})
}

func TestUserRepository_FindAccountIsExist(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()

	t.Run("returns true when account exists", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"count"}).AddRow(1)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users"`)).
			WillReturnRows(rows)

		exists := repo.FindAccountIsExist(ctx, "test@example.com", "testuser")
		assert.True(t, exists)
	})

	t.Run("returns false when account does not exist", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"count"}).AddRow(0)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "users"`)).
			WillReturnRows(rows)

		exists := repo.FindAccountIsExist(ctx, "new@example.com", "newuser")
		assert.False(t, exists)
	})
}

func TestUserRepository_Authentication(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()
	email := "test@example.com"
	userId := uuid.New()

	t.Run("authenticates user successfully", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "email", "password", "username"}).
			AddRow(userId, email, "hashedpassword", "testuser")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1`)).
			WithArgs(email).
			WillReturnRows(rows)

		user, err := repo.Authentication(ctx, email)
		assert.NoError(t, err)
		assert.Equal(t, email, user.Email)
	})

	t.Run("returns error when user not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1`)).
			WithArgs(email).
			WillReturnRows(sqlmock.NewRows([]string{}))

		user, err := repo.Authentication(ctx, email)
		assert.Error(t, err)
		assert.Equal(t, "user not found", err.Error())
		assert.Empty(t, user.Email)
	})
}

func TestUserRepository_FindAll(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()

	t.Run("finds all users with no filters", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "username", "email", "name", "role"}).
			AddRow(uuid.New(), "user1", "user1@test.com", "User 1", "user").
			AddRow(uuid.New(), "user2", "user2@test.com", "User 2", "admin")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" ORDER BY created_at DESC`)).
			WillReturnRows(rows)

		users := repo.FindAll(ctx, model.FindAllUserRequest{})
		assert.Len(t, users, 2)
	})

	t.Run("finds users with search filter", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "username", "email", "name"}).
			AddRow(uuid.New(), "testuser", "test@example.com", "Test User")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE name ILIKE $1 ORDER BY created_at DESC`)).
			WithArgs("%Test%").
			WillReturnRows(rows)

		users := repo.FindAll(ctx, model.FindAllUserRequest{Search: "Test"})
		assert.Len(t, users, 1)
	})

	t.Run("finds users with role filter", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"user_id", "username", "email", "name", "role"}).
			AddRow(uuid.New(), "admin1", "admin@test.com", "Admin User", "admin")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE role = $1 ORDER BY created_at DESC`)).
			WithArgs("admin").
			WillReturnRows(rows)

		users := repo.FindAll(ctx, model.FindAllUserRequest{Role: "admin"})
		assert.Len(t, users, 1)
	})
}

func TestUserRepository_CreateOtp(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()

	t.Run("creates OTP successfully", func(t *testing.T) {
		userOtp := entity.UserOtp{
			Email:     "test@example.com",
			Otp:       "123456",
			ExpiredAt: time.Now().Add(15 * time.Minute),
			CreatedAt: time.Now(),
		}

		mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO user_otp`)).
			WithArgs(userOtp.Email, userOtp.Otp, sqlmock.AnyArg(), sqlmock.AnyArg()).
			WillReturnResult(sqlmock.NewResult(1, 1))

		result := repo.CreateOtp(ctx, userOtp)
		assert.Equal(t, userOtp.Email, result.Email)
		assert.Equal(t, userOtp.Otp, result.Otp)
	})
}

func TestUserRepository_FindOtpByEmail(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewUserRepository(db)
	ctx := context.Background()
	email := "test@example.com"

	t.Run("finds OTP successfully", func(t *testing.T) {
		expiredAt := time.Now().Add(15 * time.Minute)
		rows := sqlmock.NewRows([]string{"email", "otp", "expired_at"}).
			AddRow(email, "123456", expiredAt)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "user_otps" WHERE email = $1`)).
			WithArgs(email).
			WillReturnRows(rows)

		otp, err := repo.FindOtpByEmail(ctx, email)
		assert.NoError(t, err)
		assert.Equal(t, email, otp.Email)
	})

	t.Run("returns error when OTP not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "user_otps" WHERE email = $1`)).
			WithArgs(email).
			WillReturnError(gorm.ErrRecordNotFound)

		otp, err := repo.FindOtpByEmail(ctx, email)
		assert.Error(t, err)
		assert.Equal(t, "otp not found", err.Error())
		assert.Empty(t, otp.Email)
	})

	t.Run("returns database error", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "user_otps" WHERE email = $1`)).
			WithArgs(email).
			WillReturnError(errors.New("database error"))

		_, err := repo.FindOtpByEmail(ctx, email)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "database error")
	})
}
