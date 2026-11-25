package repository

import (
	"context"
	"errors"
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
		mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "tryouts"`)).
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectCommit()

		result, err := repo.Create(ctx, tryout, nil)
		assert.NoError(t, err)
		assert.NotEqual(t, uuid.Nil, result.TryoutID)
	})

	t.Run("returns the insert error instead of a tryout", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "tryouts"`)).
			WillReturnError(errors.New(`column "scoring_mode" does not exist`))
		mock.ExpectRollback()

		_, err := repo.Create(ctx, entity.Tryout{Title: "Broken"}, []entity.Question{{LocalID: 1}})
		assert.ErrorContains(t, err, "scoring_mode")
		assert.NoError(t, mock.ExpectationsWereMet(), "questions must not be inserted")
	})

	t.Run("saves questions in the same transaction", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "tryouts"`)).WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "questions"`)).WillReturnError(errors.New("fk violation"))
		mock.ExpectRollback()

		_, err := repo.Create(ctx, entity.Tryout{Title: "With questions"}, []entity.Question{{LocalID: 1}})
		assert.Error(t, err)
		assert.NoError(t, mock.ExpectationsWereMet(), "tryout insert must be rolled back")
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
			WithArgs(tryoutId, 1).
			WillReturnRows(rows)

		tryout, err := repo.FindById(ctx, tryoutId)
		assert.NoError(t, err)
		assert.Equal(t, "Test Tryout", tryout.Title)
	})

	t.Run("returns error when not found", func(t *testing.T) {
		mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "tryouts" WHERE tryout_id = $1`)).
			WithArgs(tryoutId, 1).
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
