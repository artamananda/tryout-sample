package exception

import (
	"encoding/json"
	"errors"

	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
)

func ErrorHandler(ctx *fiber.Ctx, err error) error {
	var validationError ValidationError
	if errors.As(err, &validationError) {
		var messages []map[string]interface{}
		if errJson := json.Unmarshal([]byte(validationError.Message), &messages); errJson != nil {
			// Plain-text validation message, return it as-is.
			return ctx.Status(fiber.StatusBadRequest).JSON(model.GeneralResponse{
				Code:    400,
				Message: "Bad Request",
				Data:    validationError.Message,
			})
		}
		return ctx.Status(fiber.StatusBadRequest).JSON(model.GeneralResponse{
			Code:    400,
			Message: "Bad Request",
			Data:    messages,
		})
	}

	var badRequestError BadRequestError
	if errors.As(err, &badRequestError) {
		return ctx.Status(fiber.StatusBadRequest).JSON(model.GeneralResponse{
			Code:    400,
			Message: "Bad Request",
			Data:    badRequestError.Message,
		})
	}

	var notFoundError NotFoundError
	if errors.As(err, &notFoundError) {
		return ctx.Status(fiber.StatusNotFound).JSON(model.GeneralResponse{
			Code:    404,
			Message: "Not Found",
			Data:    err.Error(),
		})
	}

	var unauthorizedError UnauthorizedError
	if errors.As(err, &unauthorizedError) {
		return ctx.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
			Data:    err.Error(),
		})
	}

	// Errors raised by Fiber itself (404 route, 405 method, body too large, ...).
	var fiberError *fiber.Error
	if errors.As(err, &fiberError) {
		return ctx.Status(fiberError.Code).JSON(model.GeneralResponse{
			Code:    fiberError.Code,
			Message: fiberError.Message,
			Data:    fiberError.Message,
		})
	}

	return ctx.Status(fiber.StatusInternalServerError).JSON(model.GeneralResponse{
		Code:    500,
		Message: "General Error",
		Data:    err.Error(),
	})
}
