package controller

import (
	"strings"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type UserController struct {
	service.UserService
	config.Config
}

func NewUserController(userService *service.UserService, config config.Config) *UserController {
	return &UserController{UserService: *userService, Config: config}
}

func (controller UserController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)
	otpLimiter := middleware.RateLimit(5, 10*60)
	loginLimiter := middleware.RateLimit(20, 5*60)

	app.Post("/v1/api/login", loginLimiter, controller.Authentication)
	app.Post("/v1/api/email/send-otp", otpLimiter, controller.SendOtp)
	app.Post("/v1/api/register", controller.SelfRegister)
	app.Post("/v1/api/user/check-by-email", controller.CheckByEmail)
	app.Post("/v1/api/forgot-password/send-otp", otpLimiter, controller.SendPasswordResetOtp)
	app.Post("/v1/api/forgot-password/reset", controller.ResetPassword)

	// Profile of the logged-in user.
	app.Get("/v1/api/me", loggedIn, controller.GetMyProfile)
	app.Patch("/v1/api/me", loggedIn, controller.UpdateMyProfile)
	app.Patch("/v1/api/me/password", loggedIn, controller.ChangeMyPassword)
	app.Post("/v1/api/me/picture", loggedIn, controller.UpdateMyPicture)

	// User management.
	app.Post("/v1/api/user", adminOnly, controller.Create)
	app.Post("/v1/api/users", adminOnly, controller.CreateBulk)
	app.Patch("/v1/api/user/:id", adminOnly, controller.Update)
	app.Delete("/v1/api/user/:id", adminOnly, controller.Delete)
	app.Put("/v1/api/user/:id/verification", adminOnly, controller.SetVerification)
	app.Delete("/v1/api/user/:id/verification", adminOnly, controller.RemoveVerification)
	app.Get("/v1/api/user-badges", loggedIn, controller.Badges)
	app.Get("/v1/api/user/:id", loggedIn, controller.FindById)
	app.Get("/v1/api/user", adminOnly, controller.FindAll)
}

func otpConfigFrom(cfg config.Config) model.SendOtpConfig {
	return model.SendOtpConfig{
		SmtpHost:     cfg.Get("GOMAIL_SMTP_HOST"),
		SmtpPort:     cfg.Get("GOMAIL_SMTP_PORT"),
		SenderName:   cfg.Get("GOMAIL_SENDER_NAME"),
		AuthEmail:    cfg.Get("GOMAIL_AUTH_EMAIL"),
		AuthPassword: cfg.Get("GOMAIL_AUTH_PASSWORD"),
	}
}

// parseBody decodes the JSON body and turns a malformed body into a 400.
func parseBody(c *fiber.Ctx, out interface{}) error {
	if err := c.BodyParser(out); err != nil {
		return exception.BadRequestError{Message: "format request tidak valid"}
	}
	return nil
}

// requireAuthUser returns the identity from the JWT on a protected route.
func requireAuthUser(c *fiber.Ctx) (middleware.AuthUser, error) {
	authUser, ok := middleware.GetAuthUser(c)
	if !ok {
		return middleware.AuthUser{}, exception.UnauthorizedError{Message: "Invalid or expired JWT"}
	}
	return authUser, nil
}

func success(c *fiber.Ctx, status int, data interface{}) error {
	return c.Status(status).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    data,
	})
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
	if err := parseBody(c, &request); err != nil {
		return err
	}

	response, err := controller.UserService.SelfRegister(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, response)
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
	if err := parseBody(c, &request); err != nil {
		return err
	}

	response, err := controller.UserService.Create(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, response)
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
	if err := parseBody(c, &requests); err != nil {
		return err
	}

	responses, err := controller.UserService.CreateBulk(c.Context(), requests)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, responses)
}

// Update handles updating an existing user (admin only).
// @Summary Update an existing user
// @Description Update an existing user. Only the fields present in the body are changed.
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
	if err := parseBody(c, &request); err != nil {
		return err
	}

	response, err := controller.UserService.Update(c.Context(), request, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, response)
}

// Badges returns the badges of many users, for lists of names.
// @Summary Badges of many users
// @Description ids is a comma-separated list of user ids (max 200).
// @Tags Users
// @Produce json
// @Param ids query string true "User IDs"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user-badges [get]
func (controller UserController) Badges(c *fiber.Ctx) error {
	result, err := controller.UserService.BadgesByIDs(c.Context(), strings.Split(c.Query("ids"), ","))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// SetVerification gives a user the blue check.
// @Summary Give a user the blue check
// @Description Admin only. label is owner, tutor or berprestasi.
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Param request body model.SetVerificationRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id}/verification [put]
func (controller UserController) SetVerification(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	adminID, err := uuid.Parse(authUser.UserID)
	if err != nil {
		return exception.UnauthorizedError{Message: "invalid token"}
	}
	var request model.SetVerificationRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.UserService.SetVerification(c.Context(), c.Params("id"), adminID, request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// RemoveVerification takes the blue check away.
// @Summary Remove a user's blue check
// @Tags Users
// @Produce json
// @Param id path string true "User ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id}/verification [delete]
func (controller UserController) RemoveVerification(c *fiber.Ctx) error {
	result, err := controller.UserService.RemoveVerification(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
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
	if err := controller.UserService.Delete(c.Context(), c.Params("id")); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// FindById handles finding a user by ID. Users can only read their own data.
// @Summary Find a user by ID
// @Description Find a user by their unique ID
// @Tags Users
// @Accept json
// @Produce json
// @Param id path string true "User ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user/{id} [get]
func (controller UserController) FindById(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	id := c.Params("id")
	if !authUser.IsAdmin() && id != authUser.UserID {
		return exception.NotFoundError{Message: "user Not Found"}
	}

	result, err := controller.UserService.FindById(c.Context(), id)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// FindAll handles finding all users (admin only).
// @Summary Find all users
// @Description Retrieve a list of all users, optionally filtered by role
// @Tags Users
// @Accept json
// @Produce json
// @Param search query string false "search users by name"
// @Param role query string false "Filter users by role"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /user [get]
func (controller UserController) FindAll(c *fiber.Ctx) error {
	params := model.FindAllUserRequest{
		Search: c.Query("search"),
		Role:   c.Query("role"),
	}
	params.Verified, _ = helper.StrToBoolPtr(c.Query("verified"))

	result := controller.UserService.FindAll(c.Context(), params)
	return success(c, fiber.StatusOK, map[string]interface{}{
		"count":   len(result),
		"next":    nil,
		"prev":    nil,
		"results": result,
	})
}

// GetMyProfile returns the profile of the logged-in user.
// @Summary Get my profile
// @Tags Profile
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me [get]
func (controller UserController) GetMyProfile(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	result, err := controller.UserService.GetProfile(c.Context(), authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// UpdateMyProfile updates the profile of the logged-in user. Email and role cannot be changed here.
// @Summary Update my profile
// @Description Only the fields present in the body are changed. An empty string clears a field.
// @Tags Profile
// @Accept json
// @Produce json
// @Param request body model.UpdateMyProfileRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me [patch]
func (controller UserController) UpdateMyProfile(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.UpdateMyProfileRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	result, err := controller.UserService.UpdateProfile(c.Context(), authUser.UserID, request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// ChangeMyPassword changes the password of the logged-in user.
// @Summary Change my password
// @Tags Profile
// @Accept json
// @Produce json
// @Param request body model.ChangePasswordRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me/password [patch]
func (controller UserController) ChangeMyPassword(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var request model.ChangePasswordRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	if err := controller.UserService.ChangePassword(c.Context(), authUser.UserID, request); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Password berhasil diubah",
	})
}

// UpdateMyPicture uploads a new profile picture for the logged-in user.
// @Summary Upload my profile picture
// @Tags Profile
// @Accept multipart/form-data
// @Param file formData file true "JPG, PNG or WEBP, max 2 MB"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me/picture [post]
func (controller UserController) UpdateMyPicture(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return exception.BadRequestError{Message: "file wajib diunggah"}
	}

	contentType, ext, err := helper.ValidateImageUpload(fileHeader, helper.MaxProfilePictureBytes)
	if err != nil {
		return exception.BadRequestError{Message: err.Error()}
	}

	result, err := controller.UserService.UpdateImage(c.Context(), model.UploadFileRequest{
		FileHeader:  fileHeader,
		ContentType: contentType,
		FolderName:  "users",
		FileName:    authUser.UserID + ext,
	}, authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
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
	if err := parseBody(c, &request); err != nil {
		return err
	}
	if err := common.Validate(request); err != nil {
		return err
	}

	result, err := controller.UserService.Authentication(c.Context(), request)
	if err != nil {
		return err
	}

	tokenJwtResult := common.GenerateToken(result.UserID.String(), result.Username, result.Role, controller.Config)
	return success(c, fiber.StatusOK, map[string]interface{}{
		"token":    tokenJwtResult,
		"user_id":  result.UserID,
		"username": result.Username,
		"role":     result.Role,
	})
}

// SendOtp handles sending OTP to user's email.
// @Summary Send OTP to user's email
// @Description Send OTP to user's email for verification
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.CreateUserOtpRequest true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /email/send-otp [post]
func (controller UserController) SendOtp(c *fiber.Ctx) error {
	var request model.CreateUserOtpRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	result, err := controller.UserService.SendOtp(c.Context(), otpConfigFrom(controller.Config), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// CheckByEmail handles checking if an email is already registered.
// @Summary Check if email is already registered
// @Description Check if an email is already registered in the system
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.CheckByEmailRequest true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /user/check-by-email [post]
func (controller UserController) CheckByEmail(c *fiber.Ctx) error {
	var request model.CheckByEmailRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	result, err := controller.UserService.CheckByEmail(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// SendPasswordResetOtp handles sending OTP for password reset.
// @Summary Send OTP for password reset
// @Description Send OTP to user's email for password reset verification
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.ForgotPasswordRequest true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /forgot-password/send-otp [post]
func (controller UserController) SendPasswordResetOtp(c *fiber.Ctx) error {
	var request model.ForgotPasswordRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	result, err := controller.UserService.SendPasswordResetOtp(c.Context(), otpConfigFrom(controller.Config), request)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "OTP sent to your email",
		Data:    result,
	})
}

// ResetPassword handles password reset with OTP verification.
// @Summary Reset password with OTP
// @Description Reset user password after OTP verification
// @Tags Users
// @Accept json
// @Produce json
// @Param request body model.ResetPasswordRequest true "Request Body"
// @Success 200 {object} model.GeneralResponse
// @Router /forgot-password/reset [post]
func (controller UserController) ResetPassword(c *fiber.Ctx) error {
	var request model.ResetPasswordRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}

	if err := controller.UserService.ResetPassword(c.Context(), request); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Password reset successfully",
	})
}
