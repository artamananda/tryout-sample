package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type SKDResultController struct {
	SKDResultService *service.SKDResultService
	config.Config
}

func NewSKDResultController(skdResultService *service.SKDResultService, config config.Config) *SKDResultController {
	return &SKDResultController{SKDResultService: skdResultService, Config: config}
}

func (controller SKDResultController) Route(app *fiber.App) {
	app.Get("/v1/api/tryout/:id/skd-result/me", middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config), controller.MyResult)
	app.Get("/v1/api/tryout/:id/skd-ranking", middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config), controller.Ranking)
	app.Get("/v1/api/tryout/:id/skd-leaderboard", middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config), controller.Leaderboard)
}

// MyResult returns the SKD score and national rank of the logged-in user.
// @Summary My SKD result and rank
// @Description The rank is provisional (is_final=false) until the tryout closes.
// @Tags SKD
// @Produce json
// @Param id path string true "Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id}/skd-result/me [get]
func (controller SKDResultController) MyResult(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.SKDResultService.MyResult(c.Context(), c.Params("id"), authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Ranking returns the full ranking with phone numbers, for admins.
// @Summary SKD ranking (admin)
// @Tags SKD
// @Produce json
// @Param id path string true "Tryout ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id}/skd-ranking [get]
func (controller SKDResultController) Ranking(c *fiber.Ctx) error {
	result, err := controller.SKDResultService.Ranking(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Leaderboard returns the public SKD ranking: name, photo, badges, province and
// scores of every participant who finished, without contact details.
// @Summary Public SKD leaderboard
// @Tags SKD
// @Produce json
// @Param id path string true "Tryout ID"
// @Param province query string false "Rank within one province"
// @Param page query int false "Page (default 1)"
// @Param limit query int false "Rows per page (default 50, max 100)"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /tryout/{id}/skd-leaderboard [get]
func (controller SKDResultController) Leaderboard(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.SKDResultService.Leaderboard(c.Context(), c.Params("id"), authUser.UserID,
		c.Query("province"), c.QueryInt("page", 1), c.QueryInt("limit", 50))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}
