package controller

import (
	"mime/multipart"
	"strings"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type RegisterProgramController struct {
	service.RegisterProgramService
	config.Config
}

func NewRegisterProgramController(registerProgramService *service.RegisterProgramService, config config.Config) *RegisterProgramController {
	return &RegisterProgramController{
		RegisterProgramService: *registerProgramService,
		Config:                 config,
	}
}

func (controller RegisterProgramController) Route(app *fiber.App) {
	app.Post("/v1/api/register-program", middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config), controller.RegisterProgram)
}

func formValue(form *multipart.Form, key string) string {
	if values := form.Value[key]; len(values) > 0 {
		return strings.TrimSpace(values[0])
	}
	return ""
}

// RegisterProgram registers the logged-in user to a program.
// @Summary Register to a program
// @Description Registers the logged-in user to a program and updates their profile with the form data.
// @Tags Programs
// @Accept multipart/form-data
// @Param file formData file true "Profile picture (JPG, PNG or WEBP, max 2 MB)"
// @Param program_id formData string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /register-program [post]
func (controller RegisterProgramController) RegisterProgram(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	form, err := c.MultipartForm()
	if err != nil {
		return exception.BadRequestError{Message: "format request tidak valid"}
	}

	files := form.File["file"]
	if len(files) == 0 {
		return exception.BadRequestError{Message: "file wajib diunggah"}
	}
	file := files[0]
	contentType, _, err := helper.ValidateImageUpload(file, helper.MaxProfilePictureBytes)
	if err != nil {
		return exception.BadRequestError{Message: err.Error()}
	}
	file.Header.Set("Content-Type", contentType)

	request := model.RegisterProgramModel{
		// The participant is always the logged-in user, never a user_id from the form.
		UserID:     authUser.UserID,
		File:       file,
		Name:       formValue(form, "name"),
		Email:      formValue(form, "email"),
		Grade:      formValue(form, "grade"),
		NISN:       formValue(form, "nisn"),
		School:     formValue(form, "school"),
		Regency:    formValue(form, "regency"),
		Province:   formValue(form, "province"),
		Motivation: formValue(form, "motivation"),
		ProgramID:  formValue(form, "program_id"),
	}

	if err := controller.RegisterProgramService.RegisterProgram(c.Context(), request, otpConfigFrom(controller.Config)); err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}
