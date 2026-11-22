package controller

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func TestQuestionsHideAnswerKeyFromParticipants(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()
	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{})
	assert.NoError(t, err)

	questionRepo := repository.NewQuestionRepository(gormDB)
	transactionRepo := repository.NewTransactionTryoutRepository(gormDB)
	questionService := service.NewQuestionService(&questionRepo, nil)
	transactionService := service.NewTransactionTryoutService(&transactionRepo)

	app := fiber.New(config.NewFiberConfiguration())
	NewQuestionController(&questionService, &transactionService, nil, nil, testConfig).Route(app)

	userID := uuid.New()
	tryoutID := uuid.New()

	// The participant already redeemed the token (status PAID).
	mock.ExpectQuery(`SELECT .* FROM "transaction_tryouts" JOIN tryouts`).
		WillReturnRows(sqlmock.NewRows([]string{"transaction_tryout_id", "tryout_id", "user_id", "status"}).
			AddRow(uuid.New(), tryoutID, userID, "PAID"))
	mock.ExpectQuery(`SELECT \* FROM "tryouts"`).
		WillReturnRows(sqlmock.NewRows([]string{"tryout_id", "duration"}).AddRow(tryoutID, 100))
	mock.ExpectQuery(`SELECT \* FROM "questions" WHERE tryout_id = \$1`).
		WillReturnRows(sqlmock.NewRows([]string{"question_id", "tryout_id", "text", "correct_answer"}).
			AddRow(uuid.New(), tryoutID, "Ibu kota Indonesia?", "Jakarta"))

	req := httptest.NewRequest("GET", "/v1/api/question?tryoutId="+tryoutID.String(), nil)
	req.Header.Set("Authorization", "Bearer "+tokenFor("user", userID.String()))
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	body, _ := io.ReadAll(resp.Body)
	var parsed struct {
		Payload struct {
			Results []map[string]interface{} `json:"results"`
		} `json:"payload"`
	}
	assert.NoError(t, json.Unmarshal(body, &parsed))
	assert.Len(t, parsed.Payload.Results, 1)
	assert.Equal(t, "Ibu kota Indonesia?", parsed.Payload.Results[0]["text"])
	_, hasAnswer := parsed.Payload.Results[0]["correct_answer"]
	assert.False(t, hasAnswer, "answer key must not be sent to participants")
	assert.NotContains(t, string(body), "Jakarta")
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestQuestionsRequireStartedTryout(t *testing.T) {
	db, mock, err := sqlmock.New()
	assert.NoError(t, err)
	defer db.Close()
	gormDB, err := gorm.Open(postgres.New(postgres.Config{Conn: db}), &gorm.Config{})
	assert.NoError(t, err)

	questionRepo := repository.NewQuestionRepository(gormDB)
	transactionRepo := repository.NewTransactionTryoutRepository(gormDB)
	questionService := service.NewQuestionService(&questionRepo, nil)
	transactionService := service.NewTransactionTryoutService(&transactionRepo)

	app := fiber.New(config.NewFiberConfiguration())
	NewQuestionController(&questionService, &transactionService, nil, nil, testConfig).Route(app)

	// No transaction: the participant never entered the token.
	mock.ExpectQuery(`SELECT .* FROM "transaction_tryouts" JOIN tryouts`).
		WillReturnRows(sqlmock.NewRows([]string{"transaction_tryout_id"}))

	req := httptest.NewRequest("GET", "/v1/api/question?tryoutId="+uuid.New().String(), nil)
	req.Header.Set("Authorization", "Bearer "+tokenFor("user", uuid.New().String()))
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	assert.NoError(t, mock.ExpectationsWereMet(), "questions are never queried")
}
