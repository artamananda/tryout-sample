package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type PackageController struct {
	PackageService *service.PackageService
	config.Config
}

func NewPackageController(packageService *service.PackageService, config config.Config) *PackageController {
	return &PackageController{PackageService: packageService, Config: config}
}

func (controller PackageController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)

	// Public price list; marks the owned package when the visitor is logged in.
	app.Get("/v1/api/program/:id/packages", middleware.OptionalJWT(controller.Config), controller.ListForProgram)

	app.Get("/v1/api/admin/program/:id/packages", adminOnly, controller.ListAllForProgram)
	app.Post("/v1/api/package", adminOnly, controller.Create)
	app.Get("/v1/api/package/:id", adminOnly, controller.FindByID)
	app.Patch("/v1/api/package/:id", adminOnly, controller.Update)
	app.Delete("/v1/api/package/:id", adminOnly, controller.Delete)
}

// ListForProgram lists the packages of a program.
// @Summary List the packages of a program
// @Tags Packages
// @Produce json
// @Param id path string true "Program ID"
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id}/packages [get]
func (controller PackageController) ListForProgram(c *fiber.Ctx) error {
	userID := ""
	if authUser, ok := middleware.GetAuthUser(c); ok && !authUser.IsAdmin() {
		userID = authUser.UserID
	}
	result, err := controller.PackageService.ListForProgram(c.Context(), c.Params("id"), userID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// ListAllForProgram lists every package of a program, including inactive ones.
// @Summary List all packages of a program (admin)
// @Tags Packages
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/program/{id}/packages [get]
func (controller PackageController) ListAllForProgram(c *fiber.Ctx) error {
	result, err := controller.PackageService.ListAllForProgram(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// Create adds a package to a program.
// @Summary Create a package (admin)
// @Tags Packages
// @Accept json
// @Produce json
// @Param request body model.CreatePackageRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /package [post]
func (controller PackageController) Create(c *fiber.Ctx) error {
	var request model.CreatePackageRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.PackageService.Create(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, result)
}

// FindByID returns one package.
// @Summary Get a package (admin)
// @Tags Packages
// @Produce json
// @Param id path string true "Package ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /package/{id} [get]
func (controller PackageController) FindByID(c *fiber.Ctx) error {
	result, err := controller.PackageService.FindByID(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Update changes the fields present in the body.
// @Summary Update a package (admin)
// @Tags Packages
// @Accept json
// @Produce json
// @Param id path string true "Package ID"
// @Param request body model.UpdatePackageRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /package/{id} [patch]
func (controller PackageController) Update(c *fiber.Ctx) error {
	var request model.UpdatePackageRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.PackageService.Update(c.Context(), c.Params("id"), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Delete removes a package that was never ordered.
// @Summary Delete a package (admin)
// @Tags Packages
// @Param id path string true "Package ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /package/{id} [delete]
func (controller PackageController) Delete(c *fiber.Ctx) error {
	if err := controller.PackageService.Delete(c.Context(), c.Params("id")); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}
