package controller

import (
	"strconv"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type LearningVideoController struct {
	service.LearningVideoService
	config.Config
}

func NewLearningVideoController(learningVideoService *service.LearningVideoService, config config.Config) *LearningVideoController {
	return &LearningVideoController{
		LearningVideoService: *learningVideoService,
		Config:               config,
	}
}

func (controller LearningVideoController) Route(app *fiber.App) {
	app.Post("/v1/api/learning-video", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Create)
	app.Put("/v1/api/learning-video/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Update)
	app.Delete("/v1/api/learning-video/:id", middleware.AuthenticateJWT([]string{"admin"}, controller.Config), controller.Delete)
	app.Get("/v1/api/learning-video/:id", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindByID)
	app.Get("/v1/api/learning-video", middleware.AuthenticateJWT([]string{"admin", "user"}, controller.Config), controller.FindAll)
}

// Create handles creation of a learning video.
// @Summary Create a learning video
// @Description Create a new learning video
// @Tags Learning Videos
// @Accept json
// @Produce json
// @Param request body model.CreateLearningVideoRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /learning-video [post]
func (controller LearningVideoController) Create(c *fiber.Ctx) error {
	var request model.CreateLearningVideoRequest
	err := c.BodyParser(&request)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	response, err := controller.LearningVideoService.Create(c.Context(), request)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    fiber.StatusCreated,
		Message: "Learning video created successfully",
		Data:    response,
	})
}

// FindByID handles finding a learning video by ID.
// @Summary Find a learning video by ID
// @Description Find a learning video by its ID
// @Tags Learning Videos
// @Produce json
// @Param id path int true "Learning Video ID"
// @Success 200 {object} model.GeneralResponse
// @Router /learning-video/{id} [get]
func (controller LearningVideoController) FindByID(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid learning video ID")
	}

	response, err := controller.LearningVideoService.FindByID(c.Context(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusNotFound, err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    fiber.StatusOK,
		Message: "Learning video found",
		Data:    response,
	})
}

// Update handles updating a learning video.
// @Summary Update a learning video
// @Description Update an existing learning video
// @Tags Learning Videos
// @Accept json
// @Produce json
// @Param id path int true "Learning Video ID"
// @Param request body model.UpdateLearningVideoRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /learning-video/{id} [put]
func (controller LearningVideoController) Update(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid learning video ID")
	}

	var request model.UpdateLearningVideoRequest
	err = c.BodyParser(&request)
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, err.Error())
	}

	response, err := controller.LearningVideoService.Update(c.Context(), id, request)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    fiber.StatusOK,
		Message: "Learning video updated successfully",
		Data:    response,
	})
}

// Delete handles deletion of a learning video.
// @Summary Delete a learning video
// @Description Delete a learning video by ID
// @Tags Learning Videos
// @Produce json
// @Param id path int true "Learning Video ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /learning-video/{id} [delete]
func (controller LearningVideoController) Delete(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "Invalid learning video ID")
	}

	err = controller.LearningVideoService.Delete(c.Context(), id)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    fiber.StatusOK,
		Message: "Learning video deleted successfully",
	})
}

// FindAll handles finding all learning videos with pagination and filters.
// @Summary Find all learning videos
// @Description Find all learning videos with optional search and filters
// @Tags Learning Videos
// @Produce json
// @Param search query string false "Search by title"
// @Param program_id query string false "Filter by program ID"
// @Param page query int false "Page number" default(1)
// @Param page_size query int false "Page size" default(10)
// @Success 200 {object} model.GeneralResponse
// @Router /learning-video [get]
func (controller LearningVideoController) FindAll(c *fiber.Ctx) error {
	search := c.Query("search", "")
	programID := c.Query("program_id")
	page, _ := strconv.Atoi(c.Query("page", "1"))
	pageSize, _ := strconv.Atoi(c.Query("page_size", "10"))

	var programIDPtr *string
	if programID != "" {
		programIDPtr = &programID
	}

	request := model.FindAllLearningVideoRequest{
		Search:    search,
		ProgramID: programIDPtr,
		Page:      page,
		PageSize:  pageSize,
	}

	responses, total, err := controller.LearningVideoService.FindAll(c.Context(), request)
	if err != nil {
		return fiber.NewError(fiber.StatusInternalServerError, err.Error())
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    fiber.StatusOK,
		Message: "Learning videos retrieved successfully",
		Data: map[string]interface{}{
			"data":       responses,
			"total":      total,
			"page":       page,
			"page_size":  pageSize,
			"total_page": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}
