package controller

import (
	"path/filepath"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type ProgramController struct {
	service.ProgramService
	config.Config
}

func NewProgramController(programService *service.ProgramService, config config.Config) *ProgramController {
	return &ProgramController{
		ProgramService: *programService,
		Config:         config,
	}
}

func (controller ProgramController) Route(app *fiber.App) {
	app.Post("/v1/api/program", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Patch("/v1/api/program/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Delete("/v1/api/program/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/program/:id", controller.FindById)
	app.Get("/v1/api/program", controller.FindAll)
	app.Put("/v1/api/program/:id/upload-image", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.UpdateImage)
}

// Create handles creation of a program.
// @Summary Create a program
// @Description Create a new program
// @Tags Programs
// @Accept json
// @Produce json
// @Param request body model.CreateProgramRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /program [post]
func (controller ProgramController) Create(c *fiber.Ctx) error {
	var request model.CreateProgramRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.ProgramService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating a program by ID.
// @Summary Update a program by ID
// @Description Update an existing program by its unique ID
// @Tags Programs
// @Accept json
// @Produce json
// @Param id path string true "Program ID"
// @Param request body model.UpdateProgramRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id} [patch]
func (controller ProgramController) Update(c *fiber.Ctx) error {
	var request model.UpdateProgramRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.ProgramService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// UpdateImage handles updating the image of a program by ID.
// @Summary Update the image of a program by ID
// @Description Update the image of an existing program by its unique ID
// @Tags Programs
// @Accept multipart/form-data
// @Param id path string true "Program ID"
// @Param file formData file true "Image file"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id}/upload-image [put]
func (controller ProgramController) UpdateImage(c *fiber.Ctx) error {
	var request model.UploadFileRequest
	id := c.Params("id")
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

	request = model.UploadFileRequest{
		FileHeader:  file,
		ContentType: file.Header.Get("Content-Type"),
		FolderName:  "programs",
		FileName:    id + filepath.Ext(file.Filename),
	}

	response, err := controller.ProgramService.UpdateImage(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deletion of a program by ID.
// @Summary Delete a program by ID
// @Description Delete an existing program by its unique ID
// @Tags Programs
// @Accept json
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id} [delete]
func (controller ProgramController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	err := controller.ProgramService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    nil,
	})
}

// FindById handles finding a program by ID.
// @Summary Find a program by ID
// @Description Retrieve an existing program by its unique ID
// @Tags Programs
// @Accept json
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id} [get]
func (controller ProgramController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")
	result, err := controller.ProgramService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all programs.
// @Summary Find all programs
// @Description Retrieve all existing programs
// @Tags Programs
// @Accept json
// @Produce json
// @Param search query string false "Search query"
// @Param is_published query boolean false "Is published"
// @Param user_id query string false "User ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program [get]
func (controller ProgramController) FindAll(c *fiber.Ctx) error {
	var request model.FindAllProgramsRequest
	err := c.QueryParser(&request)
	if err != nil {
		return err
	}

	result, err := controller.ProgramService.FindAll(c.Context(), request)
	if err != nil {
		return err
	}

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
