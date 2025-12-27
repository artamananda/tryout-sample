package exception

import (
	"encoding/json"
	"errors"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestErrorHandler(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: ErrorHandler,
	})

	t.Run("handles validation error", func(t *testing.T) {
		app.Get("/validation", func(c *fiber.Ctx) error {
			validationMsg := `[{"field":"email","message":"invalid email"}]`
			return ValidationError{Message: validationMsg}
		})

		req := httptest.NewRequest("GET", "/validation", nil)
		resp, _ := app.Test(req)

		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		var response model.GeneralResponse
		json.Unmarshal(body, &response)

		assert.Equal(t, 400, response.Code)
		assert.Equal(t, "Bad Request", response.Message)
	})

	t.Run("handles not found error", func(t *testing.T) {
		app.Get("/notfound", func(c *fiber.Ctx) error {
			return NotFoundError{Message: "resource not found"}
		})

		req := httptest.NewRequest("GET", "/notfound", nil)
		resp, _ := app.Test(req)

		assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		var response model.GeneralResponse
		json.Unmarshal(body, &response)

		assert.Equal(t, 404, response.Code)
		assert.Equal(t, "Not Found", response.Message)
		assert.Equal(t, "resource not found", response.Data)
	})

	t.Run("handles unauthorized error", func(t *testing.T) {
		app.Get("/unauthorized", func(c *fiber.Ctx) error {
			return UnauthorizedError{Message: "invalid token"}
		})

		req := httptest.NewRequest("GET", "/unauthorized", nil)
		resp, _ := app.Test(req)

		assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		var response model.GeneralResponse
		json.Unmarshal(body, &response)

		assert.Equal(t, 401, response.Code)
		assert.Equal(t, "Unauthorized", response.Message)
		assert.Equal(t, "invalid token", response.Data)
	})

	t.Run("handles general error", func(t *testing.T) {
		app.Get("/general", func(c *fiber.Ctx) error {
			return errors.New("something went wrong")
		})

		req := httptest.NewRequest("GET", "/general", nil)
		resp, _ := app.Test(req)

		assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)

		body, _ := io.ReadAll(resp.Body)
		var response model.GeneralResponse
		json.Unmarshal(body, &response)

		assert.Equal(t, 500, response.Code)
		assert.Equal(t, "General Error", response.Message)
		assert.Equal(t, "something went wrong", response.Data)
	})
}
