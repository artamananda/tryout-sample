package controller

import (
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type TryoutController struct {
	TryoutService service.TryoutService
}

func NewTryoutController(tryoutService service.TryoutService) *TryoutController {
	return &TryoutController{TryoutService: tryoutService}
}

func (controller TryoutController) Route(app *fiber.App) {
	app.Post("/v1/api/tryout", controller.Create)
	app.Put("/v1/api/tryout/:id", controller.Update)
	app.Delete("/v1/api/tryout/:id", controller.Delete)
	app.Get("/v1/api/tryout/:id", controller.FindById)
	app.Get("/v1/api/tryout", controller.FindAll)
}

func (controller TryoutController) Create(c *fiber.Ctx) error {
	var request model.CreateTryoutRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TryoutService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller TryoutController) Update(c *fiber.Ctx) error {
	var request model.UpdateTryoutRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TryoutService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller TryoutController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.TryoutService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller TryoutController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.TryoutService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller TryoutController) FindAll(c *fiber.Ctx) error {
	result := controller.TryoutService.FindAll(c.Context())
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}
