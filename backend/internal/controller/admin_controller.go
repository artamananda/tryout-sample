package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
)

// Scheduler interface so we don't import the cron package directly.
type GeneratorScheduler interface {
	TriggerGenerateForType(typeCode string, count int) (int, error)
}

type AdminController struct {
	Scheduler GeneratorScheduler
	Config    config.Config
}

func NewAdminController(scheduler GeneratorScheduler, cfg config.Config) *AdminController {
	return &AdminController{Scheduler: scheduler, Config: cfg}
}

func (c *AdminController) Route(app *fiber.App) {
	app.Post("/v1/api/admin/generate/:type", middleware.AuthenticateJWT([]string{"admin"}, c.Config), c.TriggerGenerate)
}

// TriggerGenerate manually generates questions for a given subtest type.
// Optional body: { "count": 5 }
func (c *AdminController) TriggerGenerate(ctx *fiber.Ctx) error {
	typeCode := ctx.Params("type")
	if typeCode == "" {
		return ctx.Status(400).JSON(model.GeneralResponse{Code: 400, Message: "type is required"})
	}

	var body struct {
		Count int `json:"count"`
	}
	_ = ctx.BodyParser(&body)
	if body.Count <= 0 || body.Count > 20 {
		body.Count = 5
	}

	saved, err := c.Scheduler.TriggerGenerateForType(typeCode, body.Count)
	if err != nil {
		return ctx.Status(500).JSON(model.GeneralResponse{
			Code:    500,
			Message: err.Error(),
		})
	}

	return ctx.JSON(model.GeneralResponse{
		Code:    200,
		Message: "Generate selesai",
		Data: map[string]interface{}{
			"type":  typeCode,
			"saved": saved,
		},
	})
}
