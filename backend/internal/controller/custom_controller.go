package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type CustomController struct {
	service.CustomService
	config.Config
}

func NewCustomController(customService *service.CustomService, config config.Config) *CustomController {
	return &CustomController{
		CustomService: *customService,
		Config:        config,
	}
}

func (controller CustomController) Route(fiber *fiber.App) {
	fiber.Post("/v1/api/custom/batch5", controller.RegisterBatch5)
}

// RegisterBatch5 handles registration of a batch 5.
// @Summary Register a batch 5
// @Description Register a new batch 5
// @Tags Custom
// @Accept json
// @Produce json
// @Param request body model.Batch5Model true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /custom/batch5 [post]
func (controller CustomController) RegisterBatch5(c *fiber.Ctx) error {
	var request model.Batch5Model
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	err = controller.CustomService.RegisterBatch5(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}
