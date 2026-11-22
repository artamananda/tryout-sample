package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type LiveClassController struct {
	LiveClassService *service.LiveClassService
	config.Config
}

func NewLiveClassController(liveClassService *service.LiveClassService, config config.Config) *LiveClassController {
	return &LiveClassController{LiveClassService: liveClassService, Config: config}
}

func (controller LiveClassController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Get("/v1/api/live-class/me", loggedIn, controller.ListMine)
	app.Post("/v1/api/live-class/:id/join", loggedIn, controller.Join)
	app.Get("/v1/api/live-class/:id/recording", loggedIn, controller.Recording)
	app.Post("/v1/api/live-class/:id/rating", loggedIn, controller.Rate)

	app.Get("/v1/api/admin/program/:id/live-classes", adminOnly, controller.ListForAdmin)
	app.Post("/v1/api/live-class", adminOnly, controller.Create)
	app.Patch("/v1/api/live-class/:id", adminOnly, controller.Update)
	app.Delete("/v1/api/live-class/:id", adminOnly, controller.Delete)
}

// ListMine lists the live classes of the user's programs.
// @Summary My live classes
// @Tags Live Classes
// @Produce json
// @Param program_id query string false "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/me [get]
func (controller LiveClassController) ListMine(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.LiveClassService.ListForUser(c.Context(), authUser.UserID, c.Query("program_id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// Join returns the meeting link (30 minutes before until the end) and records attendance.
// @Summary Join a live class
// @Tags Live Classes
// @Produce json
// @Param id path string true "Class ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/{id}/join [post]
func (controller LiveClassController) Join(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	url, err := controller.LiveClassService.Join(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]string{"meeting_url": url})
}

// Recording returns the recording link while the package includes it.
// @Summary Get a class recording
// @Tags Live Classes
// @Produce json
// @Param id path string true "Class ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/{id}/recording [get]
func (controller LiveClassController) Recording(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	url, err := controller.LiveClassService.Recording(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]string{"recording_url": url})
}

// Rate stores the user's rating of a class.
// @Summary Rate a live class
// @Tags Live Classes
// @Accept json
// @Produce json
// @Param id path string true "Class ID"
// @Param request body model.RateLiveClassRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/{id}/rating [post]
func (controller LiveClassController) Rate(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	var request model.RateLiveClassRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	if err := controller.LiveClassService.Rate(c.Context(), authUser.UserID, c.Params("id"), request); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// ListForAdmin lists classes with links, attendance and ratings.
// @Summary List live classes of a program (admin)
// @Tags Live Classes
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/program/{id}/live-classes [get]
func (controller LiveClassController) ListForAdmin(c *fiber.Ctx) error {
	result, err := controller.LiveClassService.ListForAdmin(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// Create schedules a live class.
// @Summary Create a live class (admin)
// @Tags Live Classes
// @Accept json
// @Produce json
// @Param request body model.CreateLiveClassRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /live-class [post]
func (controller LiveClassController) Create(c *fiber.Ctx) error {
	var request model.CreateLiveClassRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.LiveClassService.Create(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, result)
}

// Update changes a live class, e.g. to add the meeting or recording link.
// @Summary Update a live class (admin)
// @Tags Live Classes
// @Accept json
// @Produce json
// @Param id path string true "Class ID"
// @Param request body model.UpdateLiveClassRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/{id} [patch]
func (controller LiveClassController) Update(c *fiber.Ctx) error {
	var request model.UpdateLiveClassRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.LiveClassService.Update(c.Context(), c.Params("id"), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Delete removes a live class.
// @Summary Delete a live class (admin)
// @Tags Live Classes
// @Param id path string true "Class ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /live-class/{id} [delete]
func (controller LiveClassController) Delete(c *fiber.Ctx) error {
	if err := controller.LiveClassService.Delete(c.Context(), c.Params("id")); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}
