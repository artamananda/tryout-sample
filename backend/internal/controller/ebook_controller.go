package controller

import (
	"path/filepath"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type EbookController struct {
	service.EbookService
	config.Config
}

func NewEbookController(ebookService *service.EbookService, config config.Config) *EbookController {
	return &EbookController{
		EbookService: *ebookService,
		Config:       config,
	}
}

func (controller EbookController) Route(app *fiber.App) {
	app.Post("/v1/api/ebook", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Put("/v1/api/ebook/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Delete("/v1/api/ebook/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/ebook/:id", controller.FindById)
	app.Get("/v1/api/ebook", controller.FindAll)
	app.Put("/v1/api/ebook/:id/upload-cover", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.UpdateCover)
	app.Put("/v1/api/ebook/:id/upload-file", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.UpdateFile)
}

// Create handles creation of a ebook for a specific tryout.
// @Summary Create a ebook
// @Description Create a new ebook for a specific tryout
// @Tags Ebooks
// @Accept json
// @Produce json
// @Param ebookId path string true "Tryout ID"
// @Param request body model.CreateEbookRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /ebook [post]
func (controller EbookController) Create(c *fiber.Ctx) error {
	var request model.CreateEbookRequest
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.EbookService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating a ebook by ID.
// @Summary Update a ebook by ID
// @Description Update an existing ebook by its unique ID
// @Tags Ebooks
// @Accept json
// @Produce json
// @Param id path string true "Ebook ID"
// @Param request body model.UpdateEbookRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ebook/{id} [put]
func (controller EbookController) Update(c *fiber.Ctx) error {
	var request model.UpdateEbookRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.EbookService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// UpdateImage handles updating the image of a ebook by ID.
// @Summary Update the image of a ebook by ID
// @Description Update the image of an existing ebook by its unique ID
// @Tags Ebooks
// @Accept multipart/form-data
// @Param id path string true "Ebook ID"
// @Param file formData file true "Image File"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ebook/{id}/upload-cover [put]
func (controller EbookController) UpdateCover(c *fiber.Ctx) error {
	var request model.UploadFileRequest
	id := c.Params("id")
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}

	// Retrieve the uploaded file from form
	files := form.File["file"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Retrieve the first file (assuming only one file is uploaded)
	file := files[0]

	// Open the uploaded file
	fileOpened, err := file.Open()
	if err != nil {
		return err
	}

	defer fileOpened.Close()

	// Fill the request struct with file information
	request = model.UploadFileRequest{
		FileHeader:  file,
		ContentType: file.Header.Get("Content-Type"),
		FolderName:  "ebooks/covers",
		FileName:    id + filepath.Ext(file.Filename),
	}

	response, err := controller.EbookService.UpdateCover(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update file of a ebook by ID.
// @Summary Update the file of a ebook by ID
// @Description Update the file of an existing ebook by its unique ID
// @Tags Ebooks
// @Accept multipart/form-data
// @Param id path string true "Ebook ID"
// @Param file formData file true "File"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ebook/{id}/upload-file [put]
func (controller EbookController) UpdateFile(c *fiber.Ctx) error {
	var request model.UploadFileRequest
	id := c.Params("id")
	form, err := c.MultipartForm()
	if err != nil {
		return err
	}

	// Retrieve the uploaded file from form
	files := form.File["file"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "No file uploaded",
		})
	}

	// Retrieve the first file (assuming only one file is uploaded)
	file := files[0]

	// Open the uploaded file
	fileOpened, err := file.Open()
	if err != nil {
		return err
	}

	defer fileOpened.Close()

	// Fill the request struct with file information
	request = model.UploadFileRequest{
		FileHeader:  file,
		ContentType: file.Header.Get("Content-Type"),
		FolderName:  "ebooks/files",
		FileName:    id + filepath.Ext(file.Filename),
	}

	response, err := controller.EbookService.UpdateFile(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting a ebook by ID.
// @Summary Delete a ebook by ID
// @Description Delete an existing ebook by its unique ID
// @Tags Ebooks
// @Accept json
// @Produce json
// @Param id path string true "Ebook ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /ebook/{id} [delete]
func (controller EbookController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.EbookService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindById handles finding a ebook by ID.
// @Summary Find a ebook by ID
// @Description Retrieve an existing ebook by its unique ID
// @Tags Ebooks
// @Accept json
// @Produce json
// @Param id path string true "Ebook ID"
// @Success 200 {object} model.GeneralResponse
// @Router /ebook/{id} [get]
func (controller EbookController) FindById(c *fiber.Ctx) error {
	id := c.Params("id")

	result, err := controller.EbookService.FindByID(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all ebooks.
// @Summary Find all ebooks
// @Description Retrieve a list of all ebooks, optionally filtered by ebookId
// @Tags Ebooks
// @Accept json
// @Produce json
// @Param ebookId query string false "Tryout ID"
// @Success 200 {object} model.GeneralResponse
// @Router /ebook [get]
func (controller EbookController) FindAll(c *fiber.Ctx) error {
	var result []model.EbookResponse
	params := model.FindAllEbookRequest{}
	params.Search = c.Query("search")
	isPublished := c.Query("isPublished")
	if isPublished != "" {
		if isPublished == "true" {
			trueValue := true
			params.IsPublished = &trueValue
		} else if isPublished == "false" {
			falseValue := false
			params.IsPublished = &falseValue
		}
	}

	result = controller.EbookService.FindAll(c.Context(), params)

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
