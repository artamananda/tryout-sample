package controller

import (
	"time"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type TransactionTryoutController struct {
	service.TransactionTryoutService
	service.TryoutService
	service.TryoutResultService
	TransactionProgramRepository *repository.TransactionProgramRepository
	AccessService                *service.AccessService
	SKDResultService             *service.SKDResultService
	config.Config
}

func NewTransactionTryoutController(
	transactionTryoutService *service.TransactionTryoutService,
	tryoutService *service.TryoutService,
	tryoutResultService *service.TryoutResultService,
	transactionProgramRepository *repository.TransactionProgramRepository,
	accessService *service.AccessService,
	skdResultService *service.SKDResultService,
	config config.Config,
) *TransactionTryoutController {
	return &TransactionTryoutController{
		TransactionTryoutService:     *transactionTryoutService,
		TryoutService:                *tryoutService,
		TryoutResultService:          *tryoutResultService,
		TransactionProgramRepository: transactionProgramRepository,
		AccessService:                accessService,
		SKDResultService:             skdResultService,
		Config:                       config,
	}
}

func (controller TransactionTryoutController) Route(app *fiber.App) {
	app.Post("/v1/api/transaction-tryout", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Create)
	// app.Patch("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Patch("/v1/api/transaction-tryout/paid", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.UpdateToPaid)
	app.Patch("/v1/api/transaction-tryout/complete", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.UpdateToFinish)
	app.Delete("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindById)
	app.Get("/v1/api/transaction-tryout", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindAll)
}

// Create handles creation of a transaction tryout.
// @Summary Create a transaction tryout
// @Description Create a new transaction tryout with provided details
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param request body model.CreateTransactionTryoutRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /transaction-tryout [post]
func (controller TransactionTryoutController) Create(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.CreateTransactionTryoutRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	request.UserID = actingUserID(authUser, request.UserID)

	response, err := controller.TransactionTryoutService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// UpdateToPaid handles updating a transaction tryout to PAID status.
// @Summary Update transaction tryout status to PAID
// @Description Update the status of a transaction tryout to PAID upon successful token validation
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param request body model.UpdateTransactionTryoutRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-tryout/paid [patch]
func (controller TransactionTryoutController) UpdateToPaid(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.UpdateTransactionTryoutRequest
	var requestBody model.UpdateTransactionTryoutRequest
	if err := parseBody(c, &requestBody); err != nil {
		return err
	}
	requestBody.UserID = actingUserID(authUser, requestBody.UserID)

	isTokenValid := controller.TryoutService.CheckTryoutToken(c.Context(), requestBody.TryoutID.String(), requestBody.Token)

	if !isTokenValid {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
			Data:    "Invalid Token",
		})
	}

	tryoutEntity, err := controller.TryoutService.TryoutRepository.FindById(c.Context(), requestBody.TryoutID.String())
	if err != nil {
		return exception.NotFoundError{Message: "Tryout Not Found"}
	}

	if !authUser.IsAdmin() {
		// Package coverage (TO number) and, for program tryouts, the open window.
		existing, findErr := controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), requestBody.TryoutID.String(), requestBody.UserID.String())
		alreadyStarted := findErr == nil && !existing.StartTime.IsZero()
		if err := controller.AccessService.EnsureCanStart(c.Context(), requestBody.UserID.String(), tryoutEntity, alreadyStarted); err != nil {
			return err
		}
	}

	transactionTryout, err := controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), requestBody.TryoutID.String(), requestBody.UserID.String())

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.GeneralResponse{
			Code:    404,
			Message: "Not Found",
			Data:    "Transaction Not Found",
		})
	}

	request.Status = "PAID"
	if transactionTryout.StartTime.IsZero() {
		request.StartTime = time.Now()
	}

	if transactionTryout.EndTime.IsZero() && transactionTryout.IsDone == true {
		request.EndTime = time.Now()
	}

	response, err := controller.TransactionTryoutService.Update(c.Context(), request, transactionTryout.TransactionTryoutID.String())
	if err != nil {
		return err
	}

	response, err = controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), requestBody.TryoutID.String(), requestBody.UserID.String())

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// UpdateToFinish handles updating a transaction tryout to COMPLETED status.
// @Summary Update transaction tryout status to COMPLETED
// @Description Update the status of a transaction tryout to COMPLETED upon successful validation
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param request body model.UpdateStatusTransactionTryoutRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-tryout/complete [patch]
func (controller TransactionTryoutController) UpdateToFinish(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.UpdateTransactionTryoutRequest
	var requestBody model.UpdateStatusTransactionTryoutRequest
	if err := parseBody(c, &requestBody); err != nil {
		return err
	}
	requestBody.UserID = actingUserID(authUser, requestBody.UserID)

	transactionTryout, err := controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), requestBody.TryoutID.String(), requestBody.UserID.String())

	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.GeneralResponse{
			Code:    404,
			Message: "Not Found",
			Data:    "Transaction Not Found",
		})
	}

	if transactionTryout.Status != "PAID" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
			Data:    "Invalid Status",
		})
	}

	request.Status = "COMPLETED"
	if transactionTryout.EndTime.IsZero() {
		request.EndTime = time.Now()
	}

	response, err := controller.TransactionTryoutService.Update(c.Context(), request, transactionTryout.TransactionTryoutID.String())
	if err != nil {
		return err
	}

	_, _ = controller.TryoutResultService.RebuildAndCacheByTryoutID(c.Context(), requestBody.TryoutID.String())
	if controller.SKDResultService != nil {
		controller.SKDResultService.Invalidate(requestBody.TryoutID.String())
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting a transaction tryout by ID.
// @Summary Delete a transaction tryout by ID
// @Description Delete a transaction tryout by its unique ID
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param id path string true "Transaction Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-tryout/{id} [delete]
func (controller TransactionTryoutController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.TransactionTryoutService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindById handles finding a transaction tryout by ID.
// @Summary Find a transaction tryout by ID
// @Description Retrieve a transaction tryout by its unique ID
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param id path string true "Transaction Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-tryout/{id} [get]
func (controller TransactionTryoutController) FindById(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	result, err := controller.TransactionTryoutService.FindByID(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	if !authUser.IsAdmin() && result.UserID.String() != authUser.UserID {
		return exception.NotFoundError{Message: "transaction tryout Not Found"}
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all transaction tryouts.
// @Summary Find all transaction tryouts
// @Description Retrieve a list of all transaction tryouts, optionally filtered by tryoutId and userId
// @Tags Transaction Tryouts
// @Accept json
// @Produce json
// @Param tryoutId query string false "Tryout ID"
// @Param userId query string false "User ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-tryout [get]
func (controller TransactionTryoutController) FindAll(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	results := []model.TransactionTryoutResponse{}
	tryoutId := c.Query("tryoutId")
	userId := c.Query("userId")
	if !authUser.IsAdmin() {
		// Participants only ever see their own transactions.
		userId = authUser.UserID
	}

	switch {
	case tryoutId != "" && userId != "":
		if result, err := controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), tryoutId, userId); err == nil {
			results = append(results, result)
		}
	case userId != "":
		results = controller.TransactionTryoutService.FindByUserID(c.Context(), userId)
	default:
		results = controller.TransactionTryoutService.FindAll(c.Context())
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

// actingUserID returns whose data a request acts on: participants always act
// as themselves, admins may act on behalf of the user in the body.
func actingUserID(authUser middleware.AuthUser, requested uuid.UUID) uuid.UUID {
	if authUser.IsAdmin() && requested != uuid.Nil {
		return requested
	}
	return uuid.MustParse(authUser.UserID)
}
