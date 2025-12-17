#!/bin/bash

cd /Users/artamananda/dev/tryout-sample/backend

# Create remaining repository tests
cat > internal/repository/user_answer_repository_test.go << 'EOF'
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

func TestUserAnswerRepository_Create(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewUserAnswerRepository(db)
ctx := context.Background()

t.Run("creates user answer successfully", func(t *testing.T) {
answer := entity.UserAnswer{
UserID:     uuid.New(),
QuestionID: uuid.New(),
Answer:     "A",
IsCorrect:  true,
}

mock.ExpectBegin()
mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "user_answers"`)).
WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
mock.ExpectCommit()

result := repo.Create(ctx, answer)
assert.NotNil(t, result)
})
}
EOF

cat > internal/repository/transaction_tryout_repository_test.go << 'EOF'
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

func TestTransactionTryoutRepository_Create(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewTransactionTryoutRepository(db)
ctx := context.Background()

t.Run("creates transaction successfully", func(t *testing.T) {
transaction := entity.TransactionTryout{
UserID:   uuid.New(),
TryoutID: uuid.New(),
Status:   "active",
}

mock.ExpectBegin()
mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "transaction_tryouts"`)).
WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
mock.ExpectCommit()

result := repo.Create(ctx, transaction)
assert.NotNil(t, result)
})
}
EOF

cat > internal/repository/program_repository_test.go << 'EOF'
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

func TestProgramRepository_Create(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewProgramRepository(db)
ctx := context.Background()

t.Run("creates program successfully", func(t *testing.T) {
program := entity.Program{
Title:       "Test Program",
Description: "Test Description",
}

mock.ExpectBegin()
mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "programs"`)).
WillReturnRows(sqlmock.NewRows([]string{"program_id"}).AddRow(uuid.New()))
mock.ExpectCommit()

result := repo.Create(ctx, program)
assert.NotEqual(t, uuid.Nil, result.ProgramID)
})
}
EOF

cat > internal/repository/transaction_program_repository_test.go << 'EOF'
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

func TestTransactionProgramRepository_Create(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewTransactionProgramRepository(db)
ctx := context.Background()

t.Run("creates transaction program successfully", func(t *testing.T) {
transaction := entity.TransactionProgram{
UserID:    uuid.New(),
ProgramID: uuid.New(),
Status:    "active",
}

mock.ExpectBegin()
mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "transaction_programs"`)).
WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(1))
mock.ExpectCommit()

result := repo.Create(ctx, transaction)
assert.NotNil(t, result)
})
}
EOF

cat > internal/repository/ebook_repository_test.go << 'EOF'
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

func TestEbookRepository_Create(t *testing.T) {
db, mock, cleanup := setupMockDB(t)
defer cleanup()

repo := NewEbookRepository(db)
ctx := context.Background()

t.Run("creates ebook successfully", func(t *testing.T) {
ebook := entity.Ebook{
Title:       "Test Ebook",
Description: "Test Description",
}

mock.ExpectBegin()
mock.ExpectQuery(regexp.QuoteMeta(`INSERT INTO "ebooks"`)).
WillReturnRows(sqlmock.NewRows([]string{"ebook_id"}).AddRow(uuid.New()))
mock.ExpectCommit()

result := repo.Create(ctx, ebook)
assert.NotEqual(t, uuid.Nil, result.EbookID)
})
}
EOF

echo "Repository tests created"
