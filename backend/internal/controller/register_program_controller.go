package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
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
		Config:        config,
	}
}

func (controller RegisterProgramController) Route(fiber *fiber.App) {
	fiber.Post("/v1/api/register-program", controller.RegisterProgram)
}

// RegisterProgram handles registration of a batch 5.
// @Summary Register a batch 5
// @Description Register a new batch 5
// @Tags RegisterProgram
// @Accept multipart/form-data
// @Produce json
// @Param user_id formData string true "User ID"
// @Param name formData string true "Name"
// @Param email formData string true "Email"
// @Param grade formData string true "Grade"
// @Param nisn formData string true "NISN"
// @Param school formData string true "School"
// @Param regency formData string true "Regency"
// @Param province formData string true "Province"
// @Param motivation formData string true "Motivation"
// @Param program_id formData string true "Program ID"
// @Param file formData file true "Profile Picture" // Menambahkan parameter file
// @Success 200 {object} model.GeneralResponse
// @Router /register-program [post]
func (controller RegisterProgramController) RegisterProgram(c *fiber.Ctx) error {
	var request model.RegisterProgramModel
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}

	files := form.File["file"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	file := files[0]

	fileOpened, err := file.Open()
	if err != nil {
		return err
	}

	defer fileOpened.Close()

	request.File = file
	request.Name = form.Value["name"][0]
	request.Email = form.Value["email"][0]
	request.Grade = form.Value["grade"][0]
	request.NISN = form.Value["nisn"][0]
	request.School = form.Value["school"][0]
	request.Regency = form.Value["regency"][0]
	request.Province = form.Value["province"][0]
	request.Motivation = form.Value["motivation"][0]
	request.ProgramID = form.Value["program_id"][0]

	otpCfg := model.SendOtpConfig{
		SmtpHost:     controller.Config.Get("GOMAIL_SMTP_HOST"),
		SmtpPort:     controller.Config.Get("GOMAIL_SMTP_PORT"),
		SenderName:   controller.Config.Get("GOMAIL_SENDER_NAME"),
		AuthEmail:    controller.Config.Get("GOMAIL_AUTH_EMAIL"),
		AuthPassword: controller.Config.Get("GOMAIL_AUTH_PASSWORD"),
	}

	err = controller.RegisterProgramService.RegisterProgram(c.Context(), request, otpCfg)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}
