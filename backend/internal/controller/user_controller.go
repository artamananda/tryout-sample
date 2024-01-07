package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type UserController struct {
	service.UserService
	config.Config
}

func NewUserController(userService *service.UserService, config *config.Config) *UserController {
	return &UserController{UserService: *userService, Config: *config}
}

func (controller UserController) Route(app *fiber.App) {
	app.Post("/v1/api/user", middleware.AuthenticateJWT("ROLE_ADMIN", controller.Config), controller.Create)
	app.Put("/v1/api/user/:id", middleware.AuthenticateJWT("ROLE_ADMIN", controller.Config), controller.Update)
	app.Delete("/v1/api/user/:id", middleware.AuthenticateJWT("ROLE_ADMIN", controller.Config), controller.Delete)
	app.Get("/v1/api/user/:id", middleware.AuthenticateJWT("ROLE_ADMIN", controller.Config), controller.FindById)
	app.Get("/v1/api/user", middleware.AuthenticateJWT("ROLE_ADMIN", controller.Config), controller.FindAll)
}

func (controller UserController) Create(c *fiber.Ctx) error {
	var request entity.RegisterRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response := controller.UserService.Create(c.Context(), request)
	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserController) Update(c *fiber.Ctx) error {
	var request entity.UpdateUserRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response := controller.UserService.Update(c.Context(), request, id)
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller UserController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	controller.UserService.Delete(c.Context(), id)
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller UserController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result := controller.UserService.FindById(c.Context(), id)
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
