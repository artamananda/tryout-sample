package repository

import (
	"context"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

func TestQuestionRepository_FindByID(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewQuestionRepository(db)
ctx := context.Background()
questionId := uuid.New()

t.Run("finds question successfully", func(t *testing.T) {
rows := sqlmock.NewRows([]string{"question_id", "text", "points"}).
AddRow(questionId, "What is 2+2?", 10)

mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "questions" WHERE question_id = $1`)).
WithArgs(questionId).
WillReturnRows(rows)

question, err := repo.FindByID(ctx, questionId)
assert.NoError(t, err)
assert.Equal(t, "What is 2+2?", question.Text)
})

t.Run("returns error when not found", func(t *testing.T) {
mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "questions" WHERE question_id = $1`)).
WithArgs(questionId).
WillReturnRows(sqlmock.NewRows([]string{}))

question, err := repo.FindByID(ctx, questionId)
assert.Error(t, err)
assert.Equal(t, "question not found", err.Error())
assert.Equal(t, uuid.Nil, question.QuestionID)
})
}

func TestQuestionRepository_FindByTryoutID(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewQuestionRepository(db)
ctx := context.Background()
tryoutId := uuid.New()

t.Run("finds questions by tryout ID", func(t *testing.T) {
rows := sqlmock.NewRows([]string{"question_id", "tryout_id", "text"}).
AddRow(uuid.New(), tryoutId, "Question 1").
AddRow(uuid.New(), tryoutId, "Question 2")

mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "questions" WHERE tryout_id = $1`)).
WithArgs(tryoutId).
WillReturnRows(rows)

questions, err := repo.FindByTryoutID(ctx, tryoutId)
assert.NoError(t, err)
assert.Len(t, questions, 2)
})
}

func TestQuestionRepository_FindAll(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewQuestionRepository(db)
ctx := context.Background()

t.Run("finds all questions", func(t *testing.T) {
rows := sqlmock.NewRows([]string{"question_id", "text"}).
AddRow(uuid.New(), "Question 1").
AddRow(uuid.New(), "Question 2")

mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "questions"`)).
WillReturnRows(rows)

questions, err := repo.FindAll(ctx)
assert.NoError(t, err)
assert.Len(t, questions, 2)
})
}

func TestQuestionRepository_Delete(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewQuestionRepository(db)
ctx := context.Background()
questionId := uuid.New()

t.Run("deletes question successfully", func(t *testing.T) {
mock.ExpectBegin()
mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM "questions" WHERE question_id = $1`)).
WithArgs(questionId).
WillReturnResult(sqlmock.NewResult(1, 1))
mock.ExpectCommit()

err := repo.Delete(ctx, questionId)
assert.NoError(t, err)
})
}
