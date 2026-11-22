package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type AnalyticsController struct {
	AnalyticsService *service.AnalyticsService
	config.Config
}

func NewAnalyticsController(analyticsService *service.AnalyticsService, config config.Config) *AnalyticsController {
	return &AnalyticsController{AnalyticsService: analyticsService, Config: config}
}

func (controller AnalyticsController) Route(app *fiber.App) {
	app.Get("/v1/api/admin/analytics", middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config), controller.Overview)
}

// Overview returns every figure of the CMS dashboard.
// @Summary Dashboard analytics (admin)
// @Tags Analytics
// @Produce json
// @Param program_id query string false "Only this program"
// @Param days query int false "Period in days (default 30, max 366)"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/analytics [get]
func (controller AnalyticsController) Overview(c *fiber.Ctx) error {
	result, err := controller.AnalyticsService.Overview(c.Context(), c.Query("program_id"), c.QueryInt("days", 30))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}
