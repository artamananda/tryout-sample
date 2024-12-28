package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type TransactionProgramController struct {
	service.TransactionProgramService
	config.Config
}

func NewTransactionProgramController(transactionProgramService *service.TransactionProgramService, config config.Config) *TransactionProgramController {
	return &TransactionProgramController{
		TransactionProgramService: *transactionProgramService,
		Config:                    config,
	}
}

func (controller TransactionProgramController) Route(app *fiber.App) {
	app.Post("/v1/api/transaction-program", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Patch("/v1/api/transaction-program/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Get("/v1/api/transaction-program/:id", controller.FindById)
	app.Get("/v1/api/transaction-program", controller.FindAll)
	app.Delete("/v1/api/transaction-program/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
}

// Create handles creation of a transaction program.
// @Summary Create a transaction program
// @Description Create a new transaction program
// @Tags Transaction Programs
// @Accept json
// @Produce json
// @Param request body model.CreateTransactionProgramRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /transaction-program [post]
func (controller TransactionProgramController) Create(c *fiber.Ctx) error {

	var request model.CreateTransactionProgramRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TransactionProgramService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating of a transaction program.
// @Summary Update a transaction program
// @Description Update a transaction program
// @Tags Transaction Programs
// @Accept json
// @Produce json
// @Param id path string true "Transaction Program ID"
// @Param request body model.UpdateTransactionProgramRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-program/{id} [patch]
func (controller TransactionProgramController) Update(c *fiber.Ctx) error {

	var request model.UpdateTransactionProgramRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TransactionProgramService.Update(c.Context(), request, c.Params("id"))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// FindById handles finding a transaction program by ID.
// @Summary Find a transaction program by ID
// @Description Find a transaction program by its unique ID
// @Tags Transaction Programs
// @Accept json
// @Produce json
// @Param id path string true "Transaction Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-program/{id} [get]
func (controller TransactionProgramController) FindById(c *fiber.Ctx) error {
	response, err := controller.TransactionProgramService.FindById(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// FindAll handles finding all transaction programs.
// @Summary Find all transaction programs
// @Description Find all transaction programs
// @Tags Transaction Programs
// @Accept json
// @Produce json
// @Security JWT
// @Param user_id query string false "User ID"
// @Param program_id query string false "Program ID"
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-program [get]
func (controller TransactionProgramController) FindAll(c *fiber.Ctx) error {
	var request model.FindAllTransactionProgramsRequest
	err := c.QueryParser(&request)
	if err != nil {
		return err
	}

	result := controller.TransactionProgramService.FindAll(c.Context(), request)

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

// Delete handles deletion of a transaction program by ID.
// @Summary Delete a transaction program by ID
// @Description Delete an existing transaction program by its unique ID
// @Tags Transaction Programs
// @Accept json
// @Produce json
// @Param id path string true "Transaction Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /transaction-program/{id} [delete]
func (controller TransactionProgramController) Delete(c *fiber.Ctx) error {
	err := controller.TransactionProgramService.Delete(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    nil,
	})
}
