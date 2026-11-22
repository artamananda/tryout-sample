package controller

import (
	"path/filepath"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type QuestionController struct {
	service.QuestionService
	TransactionTryoutService *service.TransactionTryoutService
	AccessService            *service.AccessService
	TryoutRepository         *repository.TryoutRepository
	config.Config
}

func NewQuestionController(
	questionService *service.QuestionService,
	transactionTryoutService *service.TransactionTryoutService,
	accessService *service.AccessService,
	tryoutRepository *repository.TryoutRepository,
	config config.Config,
) *QuestionController {
	return &QuestionController{
		QuestionService:          *questionService,
		TransactionTryoutService: transactionTryoutService,
		AccessService:            accessService,
		TryoutRepository:         tryoutRepository,
		Config:                   config,
	}
}

func (controller QuestionController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Post("/v1/api/question/:tryoutId", adminOnly, controller.Create)
	app.Put("/v1/api/question/:id", adminOnly, controller.Update)
	app.Delete("/v1/api/question/:id", adminOnly, controller.Delete)
	app.Get("/v1/api/question/:id", loggedIn, controller.FindById)
	app.Get("/v1/api/question", loggedIn, controller.FindAll)
	app.Put("/v1/api/question/:id/upload-image", adminOnly, controller.UpdateImage)
}

// hideAnswers removes the answer key, TKP weights and explanations before
// questions are sent to a participant.
func hideAnswers(questions []model.QuestionResponse) []model.QuestionResponse {
	for i := range questions {
		questions[i].CorrectAnswer = ""
		questions[i].OptionScores = nil
		questions[i].Explanation = ""
	}
	return questions
}

// canReview reports whether the participant may see the answer key and the
// written explanations of the tryout (after it closes, if the package has them).
func (controller QuestionController) canReview(c *fiber.Ctx, tryoutID string, userID string) bool {
	if controller.AccessService == nil || controller.TryoutRepository == nil {
		return false
	}
	tryout, err := controller.TryoutRepository.FindById(c.Context(), tryoutID)
	if err != nil {
		return false
	}
	return controller.AccessService.CanReviewExplanation(c.Context(), userID, tryout)
}

// Create handles creation of a question for a specific tryout.
// @Summary Create a question
// @Description Create a new question for a specific tryout
// @Tags Questions
// @Accept json
// @Produce json
// @Param tryoutId path string true "Tryout ID"
// @Param request body model.CreateQuestionRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /question/{tryoutId} [post]
func (controller QuestionController) Create(c *fiber.Ctx) error {
	var request model.CreateQuestionRequest
	tryoutID := c.Params("tryoutId")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.QuestionService.Create(c.Context(), request, tryoutID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Update handles updating a question by ID.
// @Summary Update a question by ID
// @Description Update an existing question by its unique ID
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path string true "Question ID"
// @Param request body model.UpdateQuestionRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /question/{id} [put]
func (controller QuestionController) Update(c *fiber.Ctx) error {
	var request model.UpdateQuestionRequest
	id := c.Params("id")
	err := c.BodyParser(&request)
	if err != nil {
		return err
	}

	response, err := controller.QuestionService.Update(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// UpdateImage handles updating the image of a question by ID.
// @Summary Update the image of a question by ID
// @Description Update the image of an existing question by its unique ID
// @Tags Questions
// @Accept multipart/form-data
// @Param id path string true "Question ID"
// @Param file formData file true "Image File"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /question/{id}/upload-image [put]
func (controller QuestionController) UpdateImage(c *fiber.Ctx) error {
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
		FolderName:  "questions",
		FileName:    id + filepath.Ext(file.Filename),
	}

	response, err := controller.QuestionService.UpdateImage(c.Context(), request, id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    response,
	})
}

// Delete handles deleting a question by ID.
// @Summary Delete a question by ID
// @Description Delete an existing question by its unique ID
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path string true "Question ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /question/{id} [delete]
func (controller QuestionController) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	err := controller.QuestionService.Delete(c.Context(), id)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
	})
}

// FindById handles finding a question by ID.
// @Summary Find a question by ID
// @Description Retrieve an existing question by its unique ID
// @Tags Questions
// @Accept json
// @Produce json
// @Param id path string true "Question ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /question/{id} [get]
func (controller QuestionController) FindById(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	result, err := controller.QuestionService.FindByID(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}

	if !authUser.IsAdmin() {
		if !controller.TransactionTryoutService.HasStarted(c.Context(), result.TryoutID.String(), authUser.UserID) {
			return exception.NotFoundError{Message: "question Not Found"}
		}
		if !controller.canReview(c, result.TryoutID.String(), authUser.UserID) {
			result = hideAnswers([]model.QuestionResponse{result})[0]
		}
	}

	return c.Status(fiber.StatusOK).JSON(model.GeneralResponse{
		Code:    200,
		Message: "Success",
		Data:    result,
	})
}

// FindAll handles finding all questions.
// @Summary Find all questions
// @Description Retrieve a list of all questions, optionally filtered by tryoutId
// @Tags Questions
// @Accept json
// @Produce json
// @Param tryoutId query string false "Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /question [get]
func (controller QuestionController) FindAll(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}

	var result []model.QuestionResponse
	tryoutId := c.Query("tryoutId")

	if !authUser.IsAdmin() {
		// Participants only see the questions of a tryout they started, without the answer key.
		if tryoutId == "" {
			return exception.BadRequestError{Message: "tryoutId wajib diisi"}
		}
		if !controller.TransactionTryoutService.HasStarted(c.Context(), tryoutId, authUser.UserID) {
			return exception.NotFoundError{Message: "tryout belum dimulai"}
		}
		result, err = controller.QuestionService.FindByTryoutID(c.Context(), tryoutId)
		if err != nil {
			return err
		}
		if !controller.canReview(c, tryoutId, authUser.UserID) {
			result = hideAnswers(result)
		}
	} else if tryoutId != "" {
		result, err = controller.QuestionService.FindByTryoutID(c.Context(), tryoutId)
	} else {
		result, err = controller.QuestionService.FindAll(c.Context())
	}

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
