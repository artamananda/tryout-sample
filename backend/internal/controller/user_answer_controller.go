package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserAnswerController struct {
	service.UserAnswerService
	config.Config
}

func NewUserAnswerController(userAnswerService *service.UserAnswerService, config config.Config) *UserAnswerController {
	return &UserAnswerController{UserAnswerService: *userAnswerService, Config: config}
}

func (controller UserAnswerController) Route(app *fiber.App) {
	app.Post("/v1/api/user-answer", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Create)
	app.Patch("/v1/api/user-answer/:id", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Update)
	app.Delete("/v1/api/user-answer/:id", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Delete)
	app.Get("/v1/api/user-answer/:id", controller.FindById)
	app.Get("/v1/api/user-answer/user/:id", controller.FindByUserId)
	app.Get("/v1/api/user-answer", controller.FindAll)
}

// Create handles creation of user answers.
// @Summary Create a user answer
// @Description Create a user answer with provided details
// @Tags User Answers
// @Accept json
// @Produce json
// @Param request body model.CreateUserAnswerRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /user-answer [post]
func (controller UserAnswerController) Create(c *fiber.Ctx) error {
	var request model.CreateUserAnswerRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating a user answer.
// @Summary Update a user answer
// @Description Update a user answer with provided details
// @Tags User Answers
// @Accept json
// @Produce json
// @Param id path string true "User Answer ID"
// @Param request body model.UpdateUserAnswerRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [patch]
func (controller UserAnswerController) Update(c *fiber.Ctx) error {
	var request model.UpdateUserAnswerRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting a user answer.
// @Summary Delete a user answer
// @Description Delete a user answer by ID
// @Tags User Answers
// @Accept json
// @Produce json
// @Param id path string true "User Answer ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [delete]
func (controller UserAnswerController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.UserAnswerService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindByUserId handles finding user answers by user ID.
// @Summary Find user answers by user ID
// @Description Retrieve user answers by user ID, optionally filtered by question ID
// @Tags User Answers
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param question_id query string false "Filter user answers by question ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/user/{id} [get]
func (controller UserAnswerController) FindByUserId(c *fiber.Ctx) error {
	id := c.Params("id")
	questionId := c.Query("question_id")

	results := controller.UserAnswerService.FindByUserID(c.Context(), id)
	if questionId != "" {
		for _, result := range results {
			if result.QuestionID == uuid.MustParse(questionId) {
				payload := map[string]interface{}{
					"count":   1,
					"next":    nil,
					"prev":    nil,
					"results": result,
				}
				return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
					Code:    200,
					Message: "Success",
					Data:    payload,
				})
			}
		}
	}
	payload := map[string]interface{}{
		"count":   len(results),
		"next":    nil,
		"prev":    nil,
		"results": results,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}

// FindById handles finding a user answer by ID.
// @Summary Find a user answer by ID
// @Description Retrieve a user answer by its unique ID
// @Tags User Answers
// @Accept json
// @Produce json
// @Param id path string true "User Answer ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [get]
func (controller UserAnswerController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.UserAnswerService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all user answers.
// @Summary Find all user answers
// @Description Retrieve a list of all user answers
// @Tags User Answers
// @Accept json
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer [get]
func (controller UserAnswerController) FindAll(c *fiber.Ctx) error {
	result := controller.UserAnswerService.FindAll(c.Context())
	payload := map[string]interface{}{
		"count":   len(result),
		"next":    nil,
		"prev":    nil,
		"results": result,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}
