package controller

import (
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type OptionController struct {
	OptionService service.OptionService
}

func NewOptionController(optionService service.OptionService) *OptionController {
	return &OptionController{OptionService: optionService}
}

func (controller OptionController) Route(app *fiber.App) {
	app.Post("/v1/api/option", controller.Create)
	app.Put("/v1/api/option/:id", controller.Update)
	app.Delete("/v1/api/option/:id", controller.Delete)
	app.Get("/v1/api/option/:id", controller.FindById)
	app.Get("/v1/api/option/question/:questionId", controller.FindAllByQuestionID)
}

func (controller OptionController) Create(c *fiber.Ctx) error {
	var request model.OptionRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	questionID := c.Params("questionId")

	response, err := controller.OptionService.Create(c.Context(), request, questionID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller OptionController) Update(c *fiber.Ctx) error {
	var request model.OptionRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.OptionService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller OptionController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.OptionService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller OptionController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.OptionService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller OptionController) FindAllByQuestionID(c *fiber.Ctx) error {
	questionID := c.Params("questionId")

	result, err := controller.OptionService.FindAllByQuestionID(c.Context(), questionID)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}
