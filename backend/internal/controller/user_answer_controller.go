package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserAnswerController struct {
	service.UserAnswerService
	config.Config
}

func NewUserAnswerController(userAnswerService *service.UserAnswerService, config config.Config) *UserAnswerController {
	return &UserAnswerController{UserAnswerService: *userAnswerService, Config: config}
}

func (controller UserAnswerController) Route(app *fiber.App) {
	app.Post("/v1/api/user-answer", middleware.AuthenticateJWT("user", controller.Config), controller.Create)
	app.Put("/v1/api/user-answer/:id", middleware.AuthenticateJWT("user", controller.Config), controller.Update)
	app.Delete("/v1/api/user-answer/:id", middleware.AuthenticateJWT("user", controller.Config), controller.Delete)
	app.Get("/v1/api/user-answer/:id", controller.FindById)
	app.Get("/v1/api/user-answer/user/:id", controller.FindByUserId)
	app.Get("/v1/api/user-answer", controller.FindAll)
}

func (controller UserAnswerController) Create(c *fiber.Ctx) error {
	var request model.CreateUserAnswerRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserAnswerController) Update(c *fiber.Ctx) error {
	var request model.UpdateUserAnswerRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserAnswerController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.UserAnswerService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller UserAnswerController) FindByUserId(c *fiber.Ctx) error {
	id := c.Params("id")
	questionId := c.Query("question_id")

	results := controller.UserAnswerService.FindByUserID(c.Context(), id)
	if questionId != "" {
		for _, result := range results {
			if result.QuestionID == uuid.MustParse(questionId) {
				payload := map[string]interface{}{
					"count":   1,
					"next":    nil,
					"prev":    nil,
					"results": result,
				}
				return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
					Code:    200,
					Message: "Success",
					Data:    payload,
				})
			}
		}
	}
	payload := map[string]interface{}{
		"count":   len(results),
		"next":    nil,
		"prev":    nil,
		"results": results,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}

func (controller UserAnswerController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.UserAnswerService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller UserAnswerController) FindAll(c *fiber.Ctx) error {
	result := controller.UserAnswerService.FindAll(c.Context())
	payload := map[string]interface{}{
		"count":   len(result),
		"next":    nil,
		"prev":    nil,
		"results": result,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}
