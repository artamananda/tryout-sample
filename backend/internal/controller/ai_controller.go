package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AIController struct {
	service.AIService
	config.Config
}

func NewAIController(aiService *service.AIService, config config.Config) *AIController {
	return &AIController{
		AIService: *aiService,
		Config:    config,
	}
}

func (controller AIController) Route(app *fiber.App) {
	app.Post("/v1/api/ai/generate-questions", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.GenerateQuestions)
}

// GenerateQuestions handles AI question generation.
// @Summary Generate questions using AI
// @Description Generate exam questions using OpenAI based on topic and parameters
// @Tags AI
// @Accept json
// @Produce json
// @Param request body model.GenerateQuestionsRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ai/generate-questions [post]
func (controller AIController) GenerateQuestions(c *fiber.Ctx) error {
	var request model.GenerateQuestionsRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.AIService.GenerateQuestions(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}
