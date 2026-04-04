package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

type TryoutResultController struct {
	service.TryoutResultService
	config.Config
}

func NewTryoutResultController(tryoutResultService *service.TryoutResultService, config config.Config) *TryoutResultController {
	return &TryoutResultController{TryoutResultService: *tryoutResultService, Config: config}
}

func (controller TryoutResultController) Route(app *fiber.App) {
	app.Get("/v1/api/tryout/:id/results", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.FindByTryoutID)
	app.Get("/v1/api/tryout/:id/results/me", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindByTryoutIDForCurrentUser)
}

func (controller TryoutResultController) FindByTryoutID(c *fiber.Ctx) error {
	id := c.Params("id")
	result, err := controller.TryoutResultService.FindByTryoutID(c.Context(), id)
	if err != nil {
		return err
	}

	payload := map[string]interface{}{
		"count":   1,
		"next":    nil,
		"prev":    nil,
		"results": []model.TryoutResultResponse{result},
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}

func (controller TryoutResultController) FindByTryoutIDForCurrentUser(c *fiber.Ctx) error {
	id := c.Params("id")
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)

	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		return exception.UnauthorizedError{Message: "invalid user claims"}
	}

	result, err := controller.TryoutResultService.FindUserResultByTryoutIDAndUserID(c.Context(), id, userID)
	if err != nil {
		return err
	}

	payload := map[string]interface{}{
		"count":   1,
		"next":    nil,
		"prev":    nil,
		"results": []model.TryoutUserResultResponse{result},
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}
