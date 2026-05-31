package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type SystemConfigController struct {
	Service service.SystemConfigService
	Config  config.Config
}

func NewSystemConfigController(svc service.SystemConfigService, cfg config.Config) SystemConfigController {
	return SystemConfigController{Service: svc, Config: cfg}
}

func (c *SystemConfigController) Route(app *fiber.App) {
	app.Get("/v1/api/system-config", middleware.AuthenticateJWT([]string{"admin"}, c.Config), c.GetAll)
	app.Put("/v1/api/system-config/:key", middleware.AuthenticateJWT([]string{"admin"}, c.Config), c.Update)
}

func (c *SystemConfigController) GetAll(ctx *fiber.Ctx) error {
	configs, err := c.Service.GetAll(ctx.Context())
	if err != nil {
		return ctx.Status(500).JSON(model.GeneralResponse{
			Code:    500,
			Message: err.Error(),
		})
	}
	return ctx.JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    configs,
	})
}

func (c *SystemConfigController) Update(ctx *fiber.Ctx) error {
	key := ctx.Params("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := ctx.BodyParser(&body); err != nil {
		return ctx.Status(400).JSON(model.GeneralResponse{
			Code:    400,
			Message: "Invalid request body",
		})
	}
	if err := c.Service.Set(ctx.Context(), key, body.Value); err != nil {
		return ctx.Status(500).JSON(model.GeneralResponse{
			Code:    500,
			Message: err.Error(),
		})
	}
	return ctx.JSON(model.GeneralResponse{
		Code:    200,
		Message: "Config updated",
	})
}
