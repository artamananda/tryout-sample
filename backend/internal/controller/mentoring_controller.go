package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type MentoringController struct {
	MentoringService *service.MentoringService
	config.Config
}

func NewMentoringController(mentoringService *service.MentoringService, config config.Config) *MentoringController {
	return &MentoringController{MentoringService: mentoringService, Config: config}
}

func (controller MentoringController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Get("/v1/api/program/:id/mentoring", loggedIn, controller.Overview)
	app.Post("/v1/api/mentoring/:id/book", loggedIn, controller.Book)
	app.Post("/v1/api/mentoring/:id/cancel", loggedIn, controller.Cancel)

	app.Get("/v1/api/admin/program/:id/mentoring", adminOnly, controller.ListForAdmin)
	app.Post("/v1/api/mentoring/slots", adminOnly, controller.CreateSlots)
	app.Patch("/v1/api/mentoring/:id", adminOnly, controller.UpdateSlot)
	app.Delete("/v1/api/mentoring/:id", adminOnly, controller.DeleteSlot)
}

// Overview lists bookable slots and the user's sessions in a program.
// @Summary My mentoring sessions
// @Tags Mentoring
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id}/mentoring [get]
func (controller MentoringController) Overview(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.MentoringService.Overview(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Book reserves a mentoring slot.
// @Summary Book a mentoring slot
// @Tags Mentoring
// @Produce json
// @Param id path string true "Slot ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /mentoring/{id}/book [post]
func (controller MentoringController) Book(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.MentoringService.Book(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Cancel releases the user's booking (until 24 hours before).
// @Summary Cancel a mentoring booking
// @Tags Mentoring
// @Param id path string true "Slot ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /mentoring/{id}/cancel [post]
func (controller MentoringController) Cancel(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	if err := controller.MentoringService.Cancel(c.Context(), authUser.UserID, c.Params("id")); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// ListForAdmin lists all slots of a program with who booked them.
// @Summary List mentoring slots (admin)
// @Tags Mentoring
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/program/{id}/mentoring [get]
func (controller MentoringController) ListForAdmin(c *fiber.Ctx) error {
	result, err := controller.MentoringService.ListForAdmin(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// CreateSlots creates slots for each date x time x tutor.
// @Summary Create mentoring slots (admin)
// @Tags Mentoring
// @Accept json
// @Produce json
// @Param request body model.CreateMentoringSlotsRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /mentoring/slots [post]
func (controller MentoringController) CreateSlots(c *fiber.Ctx) error {
	var request model.CreateMentoringSlotsRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	created, err := controller.MentoringService.CreateSlots(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, map[string]int64{"created": created})
}

// UpdateSlot changes a slot status (DONE/NO_SHOW/...), link or notes.
// @Summary Update a mentoring slot (admin)
// @Tags Mentoring
// @Accept json
// @Produce json
// @Param id path string true "Slot ID"
// @Param request body model.UpdateMentoringSlotRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /mentoring/{id} [patch]
func (controller MentoringController) UpdateSlot(c *fiber.Ctx) error {
	var request model.UpdateMentoringSlotRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	if err := controller.MentoringService.UpdateSlot(c.Context(), c.Params("id"), request); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// DeleteSlot removes a slot nobody booked.
// @Summary Delete a mentoring slot (admin)
// @Tags Mentoring
// @Param id path string true "Slot ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /mentoring/{id} [delete]
func (controller MentoringController) DeleteSlot(c *fiber.Ctx) error {
	if err := controller.MentoringService.DeleteSlot(c.Context(), c.Params("id")); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}
