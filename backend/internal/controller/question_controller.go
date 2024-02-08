package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type QuestionController struct {
	service.QuestionService
	config.Config
}

func NewQuestionController(questionService *service.QuestionService, config config.Config) *QuestionController {
	return &QuestionController{QuestionService: *questionService, Config: config}
}

func (controller QuestionController) Route(app *fiber.App) {
	app.Post("/v1/api/question/:tryoutId", middleware.AuthenticateJWT("admin", controller.Config), controller.Create)
	app.Put("/v1/api/question/:id", middleware.AuthenticateJWT("admin", controller.Config), controller.Update)
	app.Delete("/v1/api/question/:id", middleware.AuthenticateJWT("admin", controller.Config), controller.Delete)
	app.Get("/v1/api/question/:id", controller.FindById)
	app.Get("/v1/api/question", controller.FindAll)
}

func (controller QuestionController) Create(c *fiber.Ctx) error {
	var request model.CreateQuestionRequest
	tryoutID := c.Params("tryoutId")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.QuestionService.Create(c.Context(), request, tryoutID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller QuestionController) Update(c *fiber.Ctx) error {
	var request model.UpdateQuestionRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.QuestionService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller QuestionController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.QuestionService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller QuestionController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.QuestionService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller QuestionController) FindAll(c *fiber.Ctx) error {
	result, err := controller.QuestionService.FindAll(c.Context())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}
