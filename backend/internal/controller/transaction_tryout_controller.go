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
	return &TransactionTryoutController{TransactionTryoutService: *transactionTryoutService, TryoutService: *tryoutService, Config: config}
}

func (controller TransactionTryoutController) Route(app *fiber.App) {
	app.Post("/v1/api/transaction-tryout", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Create)
	app.Patch("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Patch("/v1/api/transaction-tryout/paid", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Update)
	app.Patch("/v1/api/transaction-tryout/complete", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.Update)
	app.Delete("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/transaction-tryout/:id", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindById)
	app.Get("/v1/api/transaction-tryout", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindAll)
}

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

func (controller TransactionTryoutController) Update(c *fiber.Ctx) error {
	var request model.UpdateTransactionTryoutRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TransactionTryoutService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

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

func (controller TransactionTryoutController) FindAll(c *fiber.Ctx) error {
	results := controller.TransactionTryoutService.FindAll(c.Context())
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
