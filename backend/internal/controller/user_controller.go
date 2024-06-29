package controller

import (
	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type UserController struct {
	service.UserService
	config.Config
}

func NewUserController(userService *service.UserService, config config.Config) *UserController {
	return &UserController{UserService: *userService, Config: config}
}

func (controller UserController) Route(app *fiber.App) {
	app.Post("/v1/api/login", controller.Authentication)
	app.Post("/v1/api/email/send-otp", controller.SendOtp)
	app.Post("/v1/api/register", controller.SelfRegister)
	app.Post("/v1/api/user", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Post("/v1/api/users", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.CreateBulk)
	app.Patch("/v1/api/user/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Delete("/v1/api/user/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/user/:id", controller.FindById)
	app.Get("/v1/api/user", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindAll)
}

// SelfRegister handles self-registration of users.
// @Summary Self-register a new user
// @Description Self-register a new user with provided details
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.SelfRegisterRequest true "Request Body"
// @Success 201 {object} model.GeneralResponse
// @Router /register [post]
func (controller UserController) SelfRegister(c *fiber.Ctx) error {
	var request model.SelfRegisterRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response, err := controller.UserService.SelfRegister(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Create handles creation of a single user.
// @Summary Create a new user
// @Description Create a new user with provided details
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.RegisterRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /user [post]
func (controller UserController) Create(c *fiber.Ctx) error {
	var request model.RegisterRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response, err := controller.UserService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// CreateBulk handles bulk creation of users.
// @Summary Create multiple users in bulk
// @Description Create multiple users in bulk with provided details
// @Tags Users
// @Accept json
// @Produce json
// @Param request body []model.RegisterRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /users [post]
func (controller UserController) CreateBulk(c *fiber.Ctx) error {
	var requests []model.RegisterRequest
	err := c.BodyParser(&requests)
	if err != nil {
		return err
	}

	responses, err := controller.UserService.CreateBulk(c.Context(), requests)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    responses,
	})
}

// Update handles updating an existing user.
// @Summary Update an existing user
// @Description Update an existing user with provided details
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body model.UpdateUserRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id} [patch]
func (controller UserController) Update(c *fiber.Ctx) error {
	var request model.UpdateUserRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	response, err := controller.UserService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting an existing user.
// @Summary Delete an existing user
// @Description Delete an existing user by ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id} [delete]
func (controller UserController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.UserService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindById handles finding a user by ID.
// @Summary Find a user by ID
// @Description Find a user by their unique ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id} [get]
func (controller UserController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.UserService.FindById(c.Context(), id)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all users.
// @Summary Find all users
// @Description Retrieve a list of all users, optionally filtered by role
// @Tags Users
// @Accept json
// @Produce json
// @Param role query string false "Filter users by role"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user [get]
func (controller UserController) FindAll(c *fiber.Ctx) error {
	role := c.Query("role")
	result := controller.UserService.FindAll(c.Context(), role)

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

// Authentication handles user authentication.
// @Summary Authenticate user
// @Description Authenticate user with provided credentials
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.LoginRequest true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /login [post]
func (controller UserController) Authentication(c *fiber.Ctx) error {
	var request model.LoginRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	result, err := controller.UserService.Authentication(c.Context(), request)
	if err != nil {
		return exception.ErrorHandler(c, exception.NotFoundError{Message: err.Error()})
	}

	tokenJwtResult := common.GenerateToken(result.Username, result.Role, controller.Config)
	resultWithToken := map[string]interface{}{
		"token":    tokenJwtResult,
		"user_id":  result.UserID,
		"username": result.Username,
		"role":     result.Role,
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    resultWithToken,
	})
}

// SendOtp handles sending OTP to user's email.
// @Summary Send OTP to user's email
// @Description Send OTP to user's email for verification
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.CreateUserOtpRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /email/send-otp [post]
func (controller UserController) SendOtp(c *fiber.Ctx) error {
	var request model.CreateUserOtpRequest
	err := c.BodyParser(&request)
	exception.PanicLogging(err)

	otpCfg := model.SendOtpConfig{
		SmtpHost:     controller.Config.Get("GOMAIL_SMTP_HOST"),
		SmtpPort:     controller.Config.Get("GOMAIL_SMTP_PORT"),
		SenderName:   controller.Config.Get("GOMAIL_SENDER_NAME"),
		AuthEmail:    controller.Config.Get("GOMAIL_AUTH_EMAIL"),
		AuthPassword: controller.Config.Get("GOMAIL_AUTH_PASSWORD"),
	}

	result, err := controller.UserService.SendOtp(c.Context(), otpCfg, request)
	if err != nil {
		return exception.ErrorHandler(c, err)
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}
