package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
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
	app.Post("/v1/api/ai/chat", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Chat)
	app.Post("/v1/api/ai/chat/log", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.SaveChatLog)
	app.Get("/v1/api/ai/chat/history", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.GetHistory)
	app.Get("/v1/api/ai/chat/history/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.GetSession)
	app.Delete("/v1/api/ai/chat/history/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.DeleteSession)
	app.Put("/v1/api/ai/chat/history/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.UpdateSession)
	app.Post("/v1/api/ai/examples", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.SaveExample)
	app.Get("/v1/api/ai/chat/history/:id/artifacts", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.GetSessionArtifacts)
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

// Chat handles AI chatbot conversation.
// @Summary Chat with AI assistant
// @Description Have a conversation with AI to discuss and generate questions
// @Tags AI
// @Accept json
// @Produce json
// @Param request body model.AIChatRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ai/chat [post]
func (controller AIController) Chat(c *fiber.Ctx) error {
	var request model.AIChatRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	claims := c.Locals("user").(*jwt.Token).Claims.(jwt.MapClaims)
	var adminID string
	if val, ok := claims["user_id"].(string); ok {
		adminID = val
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized: Please login again (Token Missing ID)",
		})
	}

	response, err := controller.AIService.Chat(c.Context(), request, adminID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// SaveChatLog handles saving chat history for background processing.
// @Summary Save chat log for processing
// @Description Save the current chat conversation to be processed by background jobs
// @Tags AI
// @Accept json
// @Produce json
// @Param request body model.SaveChatLogRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ai/chat/log [post]
func (controller AIController) SaveChatLog(c *fiber.Ctx) error {
	var request model.SaveChatLogRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	claims := c.Locals("user").(*jwt.Token).Claims.(jwt.MapClaims)

	var adminID string
	if val, ok := claims["user_id"].(string); ok {
		adminID = val
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized: Please login again (Token Missing ID)",
		})
	}

	err = controller.AIService.SaveChatLog(c.Context(), request, adminID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Chat log saved for processing",
	})
}

func (controller AIController) GetHistory(c *fiber.Ctx) error {
	claims := c.Locals("user").(*jwt.Token).Claims.(jwt.MapClaims)
	var adminID string
	if val, ok := claims["user_id"].(string); ok {
		adminID = val
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
		})
	}

	response, err := controller.AIService.GetHistory(c.Context(), adminID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller AIController) GetSession(c *fiber.Ctx) error {
	id := c.Params("id")
	response, err := controller.AIService.GetSession(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

func (controller AIController) DeleteSession(c *fiber.Ctx) error {
	id := c.Params("id")
	err := controller.AIService.DeleteSession(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

func (controller AIController) UpdateSession(c *fiber.Ctx) error {
	id := c.Params("id")
	var request model.UpdateChatLogRequest
	if err := c.BodyParser(&request); err != nil {
		return err
	}

	claims := c.Locals("user").(*jwt.Token).Claims.(jwt.MapClaims)
	var adminID string
	if val, ok := claims["user_id"].(string); ok {
		adminID = val
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
		})
	}

	if err := controller.AIService.UpdateSession(c.Context(), id, request, adminID); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Session Updated",
	})
}

func (controller AIController) SaveExample(c *fiber.Ctx) error {
	var request model.SaveAIExampleRequest
	if err := c.BodyParser(&request); err != nil {
		return err
	}

	claims := c.Locals("user").(*jwt.Token).Claims.(jwt.MapClaims)
	var adminID string
	if val, ok := claims["user_id"].(string); ok {
		adminID = val
	} else {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
		})
	}

	if err := controller.AIService.SaveExample(c.Context(), request, adminID); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    201,
		Message: "Example Saved",
	})
}

func (controller AIController) GetSessionArtifacts(c *fiber.Ctx) error {
	id := c.Params("id")
	if id == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.GeneralResponse{Code: 400, Message: "Session ID required"})
	}

	artifacts, err := controller.AIService.GetSessionArtifacts(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Artifacts Retrieved",
		Data:    artifacts,
	})
}
