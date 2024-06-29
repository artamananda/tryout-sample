package controller

import (
	"time"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type TransactionTryoutController struct {
	service.TransactionTryoutService
	service.TryoutService
	config.Config
}

func NewTransactionTryoutController(transactionTryoutService *service.TransactionTryoutService, tryoutService *service.TryoutService, config config.Config) *TransactionTryoutController {
	return &TransactionTryoutController{
		TransactionTryoutService: *transactionTryoutService,
		TryoutService:            *tryoutService,
		Config:                   config,
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
	var request model.CreateTransactionTryoutRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

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
	var request model.UpdateTransactionTryoutRequest
	var requestBody model.UpdateTransactionTryoutRequest
	err := c.BodyParser(&requestBody)
	if err != nil {
		return err
	}

	isTokenValid := controller.TryoutService.CheckTryoutToken(c.Context(), requestBody.TryoutID.String(), requestBody.Token)

	if !isTokenValid {
		return c.Status(fiber.StatusUnauthorized).JSON(model.GeneralResponse{
			Code:    401,
			Message: "Unauthorized",
			Data:    "Invalid Token",
		})
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

	response, err := controller.TransactionTryoutService.Update(c.Context(), request, transactionTryout.TransactionTryoutID.String())
	if err != nil {
		return err
	}

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
	var request model.UpdateTransactionTryoutRequest
	var requestBody model.UpdateStatusTransactionTryoutRequest
	err := c.BodyParser(&requestBody)
	if err != nil {
		return err
	}

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
	id := c.Params("id")

	result, err := controller.TransactionTryoutService.FindByID(c.Context(), id)
	if err != nil {
		return err
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
	var results []model.TransactionTryoutResponse
	tryoutId := c.Query("tryoutId")
	userId := c.Query("userId")

	if tryoutId != "" && userId != "" {
		result, err := controller.TransactionTryoutService.FindByTryoutIDAndUserID(c.Context(), tryoutId, userId)
		if err == nil {
			results = append(results, result)
		}
	} else {
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
