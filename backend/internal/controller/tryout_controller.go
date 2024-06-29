package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

type TryoutController struct {
	service.TryoutService
	config.Config
}

func NewTryoutController(tryoutService *service.TryoutService, config config.Config) *TryoutController {
	return &TryoutController{TryoutService: *tryoutService, Config: config}
}

func (controller TryoutController) Route(app *fiber.App) {
	app.Post("/v1/api/tryout", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Patch("/v1/api/tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Delete("/v1/api/tryout/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/tryout/:id", controller.FindById)
	app.Get("/v1/api/tryout", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindAll)
}

// Create handles creation of a tryout.
// @Summary Create a tryout
// @Description Create a new tryout with provided details
// @Tags Tryouts
// @Accept json
// @Produce json
// @Param request body model.CreateTryoutRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /tryout [post]
func (controller TryoutController) Create(c *fiber.Ctx) error {
	var request model.CreateTryoutRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TryoutService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating a tryout.
// @Summary Update a tryout
// @Description Update an existing tryout with provided details
// @Tags Tryouts
// @Accept json
// @Produce json
// @Param id path string true "Tryout ID"
// @Param request body model.UpdateTryoutRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id} [patch]
func (controller TryoutController) Update(c *fiber.Ctx) error {
	var request model.UpdateTryoutRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.TryoutService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting a tryout.
// @Summary Delete a tryout
// @Description Delete a tryout by ID
// @Tags Tryouts
// @Accept json
// @Produce json
// @Param id path string true "Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id} [delete]
func (controller TryoutController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.TryoutService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindById handles finding a tryout by ID.
// @Summary Find a tryout by ID
// @Description Retrieve a tryout by its unique ID
// @Tags Tryouts
// @Accept json
// @Produce json
// @Param id path string true "Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id} [get]
func (controller TryoutController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.TryoutService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all tryouts.
// @Summary Find all tryouts
// @Description Retrieve a list of all tryouts, accessible based on user role
// @Tags Tryouts
// @Accept json
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout [get]
func (controller TryoutController) FindAll(c *fiber.Ctx) error {
	user := c.Locals("user").(*jwt.Token)
	claims := user.Claims.(jwt.MapClaims)
	role := claims["roles"].(string)

	if role == "admin" {
		result := controller.TryoutService.FindAllAsAdmin(c.Context())
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

	result := controller.TryoutService.FindAll(c.Context())
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
