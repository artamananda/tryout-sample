package controller

import (
	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type UserController struct {
	service.UserService
	config.Config
}

func NewUserController(userService *service.UserService, config config.Config) *UserController {
	return &UserController{UserService: *userService, Config: config}
}

func (controller UserController) Route(app *fiber.App) {
	app.Post("/v1/api/login", controller.Authentication)
	app.Post("/v1/api/user", controller.Create)
	app.Put("/v1/api/user/:id", controller.Update)
	app.Delete("/v1/api/user/:id", controller.Delete)
	app.Get("/v1/api/user/:id", controller.FindById)
	app.Get("/v1/api/user", controller.FindAll)
}

func (controller UserController) Create(c *fiber.Ctx) error {
	var request model.RegisterRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response, err := controller.UserService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserController) Update(c *fiber.Ctx) error {
	var request model.UpdateUserRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response, err := controller.UserService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.UserService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller UserController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.UserService.FindById(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller UserController) FindAll(c *fiber.Ctx) error {
	result := controller.UserService.FindAll(c.Context())
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

func (controller UserController) Authentication(c *fiber.Ctx) error {
	var request model.LoginRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	result := controller.UserService.Authentication(c.Context(), request)

	tokenJwtResult := common.GenerateToken(result.Username, result.Role, controller.Config)
	resultWithToken := map[string]interface{}{
		"token":    tokenJwtResult,
		"username": result.Username,
		"role":     result.Role,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    resultWithToken,
	})
}
