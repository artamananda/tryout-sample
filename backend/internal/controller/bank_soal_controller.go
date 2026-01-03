package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

type BankSoalController struct {
	service.BankSoalService
	config.Config
}

func NewBankSoalController(bankSoalService *service.BankSoalService, config config.Config) *BankSoalController {
	return &BankSoalController{
		BankSoalService: *bankSoalService,
		Config:          config,
	}
}

func (controller BankSoalController) Route(app *fiber.App) {
	app.Post("/v1/api/bank-soal", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Post("/v1/api/bank-soal/batch", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.CreateBatch)
	app.Put("/v1/api/bank-soal/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Get("/v1/api/bank-soal/types", controller.GetUniqueTypes)
	app.Get("/v1/api/bank-soal/:id", controller.FindById)
	app.Get("/v1/api/bank-soal", controller.FindAll)
	app.Delete("/v1/api/bank-soal/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
}

// Create handles creation of a bank soal question.
// @Summary Create a bank soal question
// @Description Create a new question in the bank soal
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param request body model.CreateBankSoalRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /bank-soal [post]
func (controller BankSoalController) Create(c *fiber.Ctx) error {
	var request model.CreateBankSoalRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	response, err := controller.BankSoalService.Create(c.Context(), request, userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    201,
		Message: "Success",
		Data:    response,
	})
}

// CreateBatch handles batch creation of bank soal questions.
// @Summary Create multiple bank soal questions
// @Description Create multiple questions in the bank soal at once
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param request body model.CreateBankSoalBatchRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /bank-soal/batch [post]
func (controller BankSoalController) CreateBatch(c *fiber.Ctx) error {
	var request model.CreateBankSoalBatchRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	userID := claims["user_id"].(string)

	response, err := controller.BankSoalService.CreateBatch(c.Context(), request, userID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    201,
		Message: "Success",
		Data:    response,
	})
}

// FindById handles finding a bank soal question by ID.
// @Summary Find a bank soal question by ID
// @Description Retrieve an existing bank soal question by its unique ID
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param id path string true "Bank Soal ID"
// @Success 200 {object} model.GeneralResponse
// @Router /bank-soal/{id} [get]
func (controller BankSoalController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.BankSoalService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all bank soal questions.
// @Summary Find all bank soal questions
// @Description Retrieve a list of all bank soal questions, optionally filtered by type
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param type query string false "Question Type"
// @Success 200 {object} model.GeneralResponse
// @Router /bank-soal [get]
func (controller BankSoalController) FindAll(c *fiber.Ctx) error {
	var result []model.BankSoalResponse
	var err error
	questionType := c.Query("type")

	if questionType != "" {
		result, err = controller.BankSoalService.FindByType(c.Context(), questionType)
	} else {
		result, err = controller.BankSoalService.FindAll(c.Context())
	}

	if err != nil {
		return err
	}

	payload := map[string]interface{}{
		"count":   len(result),
		"results": result,
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    payload,
	})
}

// Delete handles deleting a bank soal question by ID.
// @Summary Delete a bank soal question by ID
// @Description Delete an existing bank soal question by its unique ID
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param id path string true "Bank Soal ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /bank-soal/{id} [delete]
func (controller BankSoalController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.BankSoalService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// Update handles updating a bank soal question.
// @Summary Update a bank soal question
// @Description Update an existing bank soal question
// @Tags BankSoal
// @Accept json
// @Produce json
// @Param id path string true "Bank Soal ID"
// @Param request body model.CreateBankSoalRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /bank-soal/{id} [put]
func (controller BankSoalController) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var request model.CreateBankSoalRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.BankSoalService.Update(c.Context(), id, request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// GetUniqueTypes handles fetching unique question types from the bank soal.
// @Summary Get unique question types
// @Description Retrieve a list of all unique question types currently in the bank soal
// @Tags BankSoal
// @Accept json
// @Produce json
// @Success 200 {object} model.GeneralResponse
// @Router /bank-soal/types [get]
func (controller BankSoalController) GetUniqueTypes(c *fiber.Ctx) error {
	result, err := controller.BankSoalService.GetUniqueTypes(c.Context())
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}
