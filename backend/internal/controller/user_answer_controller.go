package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserAnswerController struct {
	service.UserAnswerService
	TransactionTryoutService *service.TransactionTryoutService
	config.Config
}

func NewUserAnswerController(userAnswerService *service.UserAnswerService, transactionTryoutService *service.TransactionTryoutService, config config.Config) *UserAnswerController {
	return &UserAnswerController{
		UserAnswerService:        *userAnswerService,
		TransactionTryoutService: transactionTryoutService,
		Config:                   config,
	}
}

func (controller UserAnswerController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Post("/v1/api/user-answer", loggedIn, controller.Create)
	app.Patch("/v1/api/user-answer/:id", loggedIn, controller.Update)
	// PUT is kept because older web builds send it.
	app.Put("/v1/api/user-answer/:id", loggedIn, controller.Update)
	app.Delete("/v1/api/user-answer/:id", loggedIn, controller.Delete)
	app.Get("/v1/api/user-answer/user/:id", loggedIn, controller.FindByUserId)
	app.Get("/v1/api/user-answer/:id", loggedIn, controller.FindById)
	app.Get("/v1/api/user-answer", adminOnly, controller.FindAll)
}

// ensureCanAnswer rejects answers from participants whose tryout is not running.
func (controller UserAnswerController) ensureCanAnswer(c *fiber.Ctx, authUser middleware.AuthUser, tryoutID uuid.UUID) error {
	if authUser.IsAdmin() {
		return nil
	}
	if !controller.TransactionTryoutService.IsInProgress(c.Context(), tryoutID.String(), authUser.UserID) {
		return exception.BadRequestError{Message: "tryout tidak sedang berlangsung"}
	}
	return nil
}

// findOwned loads an answer and hides answers of other users from participants.
func (controller UserAnswerController) findOwned(c *fiber.Ctx, authUser middleware.AuthUser, id string) (model.UserAnswerResponse, error) {
	if _, err := uuid.Parse(id); err != nil {
		return model.UserAnswerResponse{}, exception.BadRequestError{Message: "user_answer_id tidak valid"}
	}
	answer, err := controller.UserAnswerService.FindByID(c.Context(), id)
	if err != nil {
		return model.UserAnswerResponse{}, exception.NotFoundError{Message: "user_answer Not Found"}
	}
	if !authUser.IsAdmin() && answer.UserID.String() != authUser.UserID {
		return model.UserAnswerResponse{}, exception.NotFoundError{Message: "user_answer Not Found"}
	}
	return answer, nil
}

// Create stores (or replaces) the answer of the logged-in user for a question.
// @Summary Create or replace a user answer
// @Tags User Answers
// @Accept json
// @Produce json
// @Param request body model.CreateUserAnswerRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /user-answer [post]
func (controller UserAnswerController) Create(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.CreateUserAnswerRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	request.UserID = actingUserID(authUser, request.UserID)
	if err := controller.ensureCanAnswer(c, authUser, request.TryoutID); err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Create(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, response)
}

// Update changes an existing answer of the logged-in user.
// @Summary Update a user answer
// @Tags User Answers
// @Accept json
// @Produce json
// @Param id path string true "User Answer ID"
// @Param request body model.UpdateUserAnswerRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [patch]
func (controller UserAnswerController) Update(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	existing, err := controller.findOwned(c, authUser, id)
	if err != nil {
		return err
	}

	var request model.UpdateUserAnswerRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	if !authUser.IsAdmin() {
		// Participants can only change the answer text, not move it elsewhere.
		request.UserID = existing.UserID
		request.TryoutID = existing.TryoutID
		request.QuestionID = existing.QuestionID
	}
	if err := controller.ensureCanAnswer(c, authUser, existing.TryoutID); err != nil {
		return err
	}

	response, err := controller.UserAnswerService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, response)
}

// Delete removes an answer of the logged-in user.
// @Summary Delete a user answer
// @Tags User Answers
// @Produce json
// @Param id path string true "User Answer ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [delete]
func (controller UserAnswerController) Delete(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	existing, err := controller.findOwned(c, authUser, id)
	if err != nil {
		return err
	}
	if err := controller.ensureCanAnswer(c, authUser, existing.TryoutID); err != nil {
		return err
	}

	if err := controller.UserAnswerService.Delete(c.Context(), id); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// FindByUserId lists the answers of a user. Participants can only list their own.
// @Summary Find user answers by user ID
// @Tags User Answers
// @Produce json
// @Param id path string true "User ID"
// @Param question_id query string false "Filter user answers by question ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/user/{id} [get]
func (controller UserAnswerController) FindByUserId(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	if !authUser.IsAdmin() && id != authUser.UserID {
		return exception.NotFoundError{Message: "user_answer Not Found"}
	}

	results := controller.UserAnswerService.FindByUserID(c.Context(), id)

	if questionIDParam := c.Query("question_id"); questionIDParam != "" {
		questionID, err := uuid.Parse(questionIDParam)
		if err != nil {
			return exception.BadRequestError{Message: "question_id tidak valid"}
		}
		for _, result := range results {
			if result.QuestionID == questionID {
				return success(c, fiber.StatusOK, map[string]interface{}{
					"count":   1,
					"next":    nil,
					"prev":    nil,
					"results": result,
				})
			}
		}
	}

	return success(c, fiber.StatusOK, map[string]interface{}{
		"count":   len(results),
		"next":    nil,
		"prev":    nil,
		"results": results,
	})
}

// FindById returns one answer. Participants can only read their own.
// @Summary Find a user answer by ID
// @Tags User Answers
// @Produce json
// @Param id path string true "User Answer ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer/{id} [get]
func (controller UserAnswerController) FindById(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	result, err := controller.findOwned(c, authUser, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// FindAll lists every answer (admin only).
// @Summary Find all user answers
// @Tags User Answers
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-answer [get]
func (controller UserAnswerController) FindAll(c *fiber.Ctx) error {
	result := controller.UserAnswerService.FindAll(c.Context())
	return success(c, fiber.StatusOK, map[string]interface{}{
		"count":   len(result),
		"next":    nil,
		"prev":    nil,
		"results": result,
	})
}
