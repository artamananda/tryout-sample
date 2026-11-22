package controller

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
)

type staticConfig map[string]string

func (c staticConfig) Get(key string) string { return c[key] }

var testConfig config.Config = staticConfig{
	"JWT_SECRET_KEY":           "test-secret",
	"JWT_EXPIRE_MINUTES_COUNT": "60",
}

// newAccessTestApp registers routes whose access rules are decided before any
// database access, so the services can stay empty.
func newAccessTestApp() *fiber.App {
	app := fiber.New(config.NewFiberConfiguration())
	NewUserController(&service.UserService{}, testConfig).Route(app)
	NewUserAnswerController(&service.UserAnswerService{}, &service.TransactionTryoutService{}, testConfig).Route(app)
	NewQuestionController(&service.QuestionService{}, &service.TransactionTryoutService{}, nil, nil, testConfig).Route(app)
	return app
}

func tokenFor(role string, userID string) string {
	return common.GenerateToken(userID, "tester", role, testConfig)
}

func request(t *testing.T, app *fiber.App, method string, path string, token string, body string) int {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	resp, err := app.Test(req)
	assert.NoError(t, err)
	return resp.StatusCode
}

func TestAccessControl(t *testing.T) {
	app := newAccessTestApp()
	me := uuid.New().String()
	someoneElse := uuid.New().String()
	userToken := tokenFor("user", me)

	cases := []struct {
		name   string
		method string
		path   string
		token  string
		body   string
		status int
	}{
		{"profile needs login", "GET", "/v1/api/me", "", "", fiber.StatusBadRequest},
		{"user list is admin only", "GET", "/v1/api/user", userToken, "", fiber.StatusUnauthorized},
		{"user detail needs login", "GET", "/v1/api/user/" + someoneElse, "", "", fiber.StatusBadRequest},
		{"users cannot read other users", "GET", "/v1/api/user/" + someoneElse, userToken, "", fiber.StatusNotFound},
		{"users cannot change other users", "PATCH", "/v1/api/user/" + someoneElse, userToken, `{"name":"x"}`, fiber.StatusUnauthorized},
		{"malformed body is a 400", "PATCH", "/v1/api/me", userToken, `{"name":`, fiber.StatusBadRequest},
		{"answer list is admin only", "GET", "/v1/api/user-answer", userToken, "", fiber.StatusUnauthorized},
		{"users cannot read answers of others", "GET", "/v1/api/user-answer/user/" + someoneElse, userToken, "", fiber.StatusNotFound},
		{"questions need login", "GET", "/v1/api/question?tryoutId=" + uuid.New().String(), "", "", fiber.StatusBadRequest},
		{"participants must pick a tryout", "GET", "/v1/api/question", userToken, "", fiber.StatusBadRequest},
		{"forged role is rejected", "GET", "/v1/api/user", common.GenerateToken(me, "x", "superadmin", testConfig), "", fiber.StatusUnauthorized},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.status, request(t, app, tc.method, tc.path, tc.token, tc.body))
		})
	}
}
