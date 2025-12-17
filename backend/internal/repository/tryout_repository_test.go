package repository

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestTryoutRepository_Create(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewTryoutRepository(db)
	ctx := context.Background()

	t.Run("creates tryout successfully", func(t *testing.T) {
		tryout := entity.Tryout{
			Title:       "Test Tryout",
			
			IsPublished: false,
		}

		mock.ExpectBegin()
		mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "tryouts"`)).
			WillReturnRows(sqlmock.NewRows([]string{"tryout_id"}).AddRow(uuid.New()))
		mock.ExpectCommit()

		result := repo.Create(ctx, tryout)
		assert.NotEqual(t, uuid.Nil, result.TryoutID)
	})
}

func TestTryoutRepository_FindById(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewTryoutRepository(db)
	ctx := context.Background()
	tryoutId := uuid.New().String()

	t.Run("finds tryout successfully", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"tryout_id", "title", "description"}).
			AddRow(tryoutId, "Test Tryout", "Description")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts" WHERE tryout_id = $1`)).
			WithArgs(tryoutId).
			WillReturnRows(rows)

		tryout, err := repo.FindById(ctx, tryoutId)
		assert.NoError(t, err)
		assert.Equal(t, "Test Tryout", tryout.Title)
	})

	t.Run("returns error when not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts" WHERE tryout_id = $1`)).
			WithArgs(tryoutId).
			WillReturnRows(sqlmock.NewRows([]string{}))

		tryout, err := repo.FindById(ctx, tryoutId)
		assert.Error(t, err)
		assert.Equal(t, "tryout Not Found", err.Error())
		assert.Equal(t, uuid.Nil, tryout.TryoutID)
	})
}

func TestTryoutRepository_FindAll(t *testing.T) {
	db, mock, cleanup := setupMockDB(t)
	defer cleanup()

	repo := NewTryoutRepository(db)
	ctx := context.Background()

	t.Run("finds all tryouts", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"tryout_id", "title", "is_published"}).
			AddRow(uuid.New(), "Tryout 1", true).
			AddRow(uuid.New(), "Tryout 2", false)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts"`)).
			WillReturnRows(rows)

		tryouts := repo.FindAll(ctx, model.FindAllTryoutRequest{})
		assert.Len(t, tryouts, 2)
	})

	t.Run("finds with search filter", func(t *testing.T) {
		rows := sqlmock.NewRows([]string{"tryout_id", "title"}).
			AddRow(uuid.New(), "Math Tryout")

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts" WHERE title ILIKE $1`)).
			WithArgs("%Math%").
			WillReturnRows(rows)

		tryouts := repo.FindAll(ctx, model.FindAllTryoutRequest{Search: "Math"})
		assert.Len(t, tryouts, 1)
	})

	t.Run("finds with published filter", func(t *testing.T) {
		published := true
		rows := sqlmock.NewRows([]string{"tryout_id", "title", "is_published"}).
			AddRow(uuid.New(), "Published Tryout", true)

		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts" WHERE is_published = $1`)).
			WithArgs(true).
			WillReturnRows(rows)

		tryouts := repo.FindAll(ctx, model.FindAllTryoutRequest{IsPublished: &published})
		assert.Len(t, tryouts, 1)
	})
}
