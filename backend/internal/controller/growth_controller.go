package controller

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type GrowthController struct {
	GrowthService          *service.GrowthService
	WeeklyReportService    *service.WeeklyReportService
	TutorFeeService        *service.TutorFeeService
	SystemConfigRepository *repository.SystemConfigRepository
	config.Config
}

func NewGrowthController(
	growthService *service.GrowthService,
	weeklyReportService *service.WeeklyReportService,
	tutorFeeService *service.TutorFeeService,
	systemConfigRepository *repository.SystemConfigRepository,
	config config.Config,
) *GrowthController {
	return &GrowthController{
		GrowthService:          growthService,
		WeeklyReportService:    weeklyReportService,
		TutorFeeService:        tutorFeeService,
		SystemConfigRepository: systemConfigRepository,
		Config:                 config,
	}
}

func (controller GrowthController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Get("/v1/api/me/referral", loggedIn, controller.Referral)
	app.Get("/v1/api/me/programs", loggedIn, controller.MyPrograms)
	app.Get("/v1/api/program/:id/progress", loggedIn, controller.Progress)
	app.Post("/v1/api/program/:id/guarantee", loggedIn, controller.ClaimGuarantee)
	app.Post("/v1/api/program/:id/certificate", loggedIn, controller.IssueCertificate)
	app.Get("/v1/api/certificate/:number", controller.VerifyCertificate)

	app.Get("/v1/api/admin/guarantee-claims", adminOnly, controller.ListClaims)
	app.Patch("/v1/api/admin/guarantee-claims/:id", adminOnly, controller.ReviewClaim)
	app.Get("/v1/api/admin/program/:id/tutor-fees", adminOnly, controller.TutorFees)
	app.Post("/v1/api/admin/weekly-report/run", adminOnly, controller.RunWeeklyReport)
	app.Get("/v1/api/admin/weekly-report/note", adminOnly, controller.GetWeeklyNote)
	app.Put("/v1/api/admin/weekly-report/note", adminOnly, controller.SetWeeklyNote)
}

// Referral returns the user's referral code and rewards.
// @Summary My referral code
// @Tags Growth
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me/referral [get]
func (controller GrowthController) Referral(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.GrowthService.ReferralInfo(c.Context(), authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// Progress returns the user's TO results, guarantee and certificate status.
// @Summary My progress in a program
// @Tags Growth
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id}/progress [get]
func (controller GrowthController) Progress(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.GrowthService.Progress(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// ClaimGuarantee files a "garansi naik kelas" claim.
// @Summary Claim the class guarantee
// @Tags Growth
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /program/{id}/guarantee [post]
func (controller GrowthController) ClaimGuarantee(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.GrowthService.ClaimGuarantee(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, result)
}

// IssueCertificate issues (or returns) the user's certificate.
// @Summary Get my certificate
// @Tags Growth
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /program/{id}/certificate [post]
func (controller GrowthController) IssueCertificate(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.GrowthService.IssueCertificate(c.Context(), authUser.UserID, c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// VerifyCertificate is the public check of a certificate number.
// @Summary Verify a certificate
// @Tags Growth
// @Produce json
// @Param number path string true "Certificate number"
// @Success 200 {object} model.GeneralResponse
// @Router /certificate/{number} [get]
func (controller GrowthController) VerifyCertificate(c *fiber.Ctx) error {
	result, err := controller.GrowthService.VerifyCertificate(c.Context(), c.Params("number"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// ListClaims lists guarantee claims.
// @Summary List guarantee claims (admin)
// @Tags Growth
// @Produce json
// @Param status query string false "PENDING, APPROVED or REJECTED"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/guarantee-claims [get]
func (controller GrowthController) ListClaims(c *fiber.Ctx) error {
	result, err := controller.GrowthService.ListClaims(c.Context(), c.Query("status"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// ReviewClaim approves or rejects a guarantee claim.
// @Summary Review a guarantee claim (admin)
// @Tags Growth
// @Accept json
// @Produce json
// @Param id path string true "Claim ID"
// @Param request body model.ReviewGuaranteeRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/guarantee-claims/{id} [patch]
func (controller GrowthController) ReviewClaim(c *fiber.Ctx) error {
	var request model.ReviewGuaranteeRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.GrowthService.ReviewClaim(c.Context(), c.Params("id"), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// TutorFees returns the tutor fee report of a program.
// @Summary Tutor fee report (admin)
// @Tags Growth
// @Produce json
// @Param id path string true "Program ID"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/program/{id}/tutor-fees [get]
func (controller GrowthController) TutorFees(c *fiber.Ctx) error {
	result, err := controller.TutorFeeService.Report(c.Context(), c.Params("id"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// RunWeeklyReport sends this week's progress emails now (or counts them).
// @Summary Run the weekly progress email (admin)
// @Tags Growth
// @Produce json
// @Param program_id query string false "Only this program"
// @Param dry_run query boolean false "Only count recipients"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/weekly-report/run [post]
func (controller GrowthController) RunWeeklyReport(c *fiber.Ctx) error {
	result, err := controller.WeeklyReportService.Run(c.Context(), c.Query("program_id"), c.QueryBool("dry_run"))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

type weeklyNoteRequest struct {
	Note string `json:"note"`
}

// GetWeeklyNote returns the announcement added to every weekly email.
// @Summary Get the weekly email note (admin)
// @Tags Growth
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/weekly-report/note [get]
func (controller GrowthController) GetWeeklyNote(c *fiber.Ctx) error {
	note := ""
	if config, err := controller.SystemConfigRepository.FindByKey(c.Context(), service.WeeklyReportNoteKey); err == nil {
		note = config.Value
	}
	return success(c, fiber.StatusOK, map[string]string{"note": note})
}

// SetWeeklyNote sets the announcement added to every weekly email.
// @Summary Set the weekly email note (admin)
// @Tags Growth
// @Accept json
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /admin/weekly-report/note [put]
func (controller GrowthController) SetWeeklyNote(c *fiber.Ctx) error {
	var request weeklyNoteRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	if len(request.Note) > 2000 {
		return exception.BadRequestError{Message: "catatan maksimal 2000 karakter"}
	}
	if err := controller.SystemConfigRepository.Upsert(c.Context(), service.WeeklyReportNoteKey, request.Note); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]string{"note": request.Note})
}

// MyPrograms lists the programs the user belongs to, with their package.
// @Summary My programs
// @Tags Growth
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /me/programs [get]
func (controller GrowthController) MyPrograms(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.GrowthService.MyPrograms(c.Context(), authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}
