package main

import (
	"context"
	"log"
	"time"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/controller"
	"github.com/artamananda/tryout-sample/internal/cron"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/payment"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"

	_ "github.com/artamananda/tryout-sample/docs"
)

const APP_VERSION = "0.7.0"

// @title Tryout Sample
// @version 0.7.0
// @description API Documentation for Telisik Tryout
// @termsOfService http://swagger.io/terms/
// @contact.name Artamananda
// @contact.email artamananda@gmail.com
// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html
// @host api.terasbelajarasik.web.id
// @BasePath /v1/api
// @securityDefinitions.apiKey JWT
// @in header
// @name Authorization
// @externalDocs.description OpenAPI
// @externalDocs.url https://swagger.io/resources/open-api/
func main() {
	initConfig := config.New()
	db := config.NewDB(initConfig)
	app := fiber.New(config.NewFiberConfiguration())
	awsConfig, _ := config.NewAWSConfig(initConfig)
	s3Client := s3.NewFromConfig(awsConfig)
	uploader := manager.NewUploader(s3Client)

	// A panic in one handler must not take down the whole API.
	app.Use(recover.New(recover.Config{EnableStackTrace: true}))

	app.Use(cors.New(cors.Config{
		AllowHeaders:     "*",
		AllowOrigins:     "*",
		AllowCredentials: false,
		AllowMethods:     "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
	}))

	userRepository := repository.NewUserRepository(db)
	tryoutRepository := repository.NewTryoutRepository(db)
	questionRepository := repository.NewQuestionRepository(db)
	userAnswerRepository := repository.NewUserAnswerRepository(db)
	transactionRepository := repository.NewTransactionTryoutRepository(db)
	programRepository := repository.NewProgramRepository(db)
	transactionProgramRepository := repository.NewTransactionProgramRepository(db)
	tryoutResultCacheRepository := repository.NewTryoutResultCacheRepository(db)
	ebookRepository := repository.NewEbookRepository(db)
	bankSoalRepository := repository.NewBankSoalRepository(db)
	chatLogRepository := repository.NewChatLogRepository(db)
	dailyChallengeRepository := repository.NewDailyChallengeRepository(db)
	questionStatisticsRepository := repository.NewQuestionStatisticsRepository(db)
	aiExampleRepository := repository.NewAIExampleRepository(db)
	chatArtifactRepository := repository.NewChatArtifactRepository(db)
	learningVideoRepository := repository.NewLearningVideoRepository(db)
	systemConfigRepository := repository.NewSystemConfigRepository(db)
	packageRepository := repository.NewPackageRepository(db)
	orderRepository := repository.NewOrderRepository(db)
	liveClassRepository := repository.NewLiveClassRepository(db)
	mentoringRepository := repository.NewMentoringRepository(db)
	growthRepository := repository.NewGrowthRepository(db)

	// Cron Scheduler
	scheduler := cron.NewScheduler(
		initConfig,
		&bankSoalRepository,
		&chatLogRepository,
		&dailyChallengeRepository,
		&questionStatisticsRepository,
		&systemConfigRepository,
	)
	scheduler.Start()
	defer scheduler.Stop()

	userService := service.NewUserService(&userRepository, uploader)
	tryoutService := service.NewTryoutService(&tryoutRepository, &questionRepository, &bankSoalRepository)
	tryoutResultService := service.NewTryoutResultService(&tryoutRepository, &questionRepository, &userAnswerRepository, &userRepository, &tryoutResultCacheRepository)
	questionService := service.NewQuestionService(&questionRepository, uploader)
	userAnswerService := service.NewUserAnswerService(&userAnswerRepository)
	transactionTryoutService := service.NewTransactionTryoutService(&transactionRepository)
	programService := service.NewProgramService(&programRepository, uploader)
	programService.PackageRepository = &packageRepository
	accessService := service.NewAccessService(&transactionProgramRepository, &packageRepository)
	packageService := service.NewPackageService(&packageRepository, &programRepository, &orderRepository, &accessService)
	orderService := service.NewOrderService(
		&orderRepository,
		&packageRepository,
		&programRepository,
		&userRepository,
		&transactionProgramRepository,
		&accessService,
		// Only the bridge base URL is configured; endpoints are fixed in the client.
		payment.NewBridgeClient(initConfig.Get("PAYMENT_BRIDGE_URL")),
	)
	skdResultService := service.NewSKDResultService(&tryoutRepository, &questionRepository, &userAnswerRepository, &transactionRepository, &userRepository)
	liveClassService := service.NewLiveClassService(&liveClassRepository, &programRepository, &accessService)
	mentoringService := service.NewMentoringService(&mentoringRepository, &userRepository, &programRepository, &accessService)
	growthService := service.NewGrowthService(&growthRepository, &userRepository, &orderRepository, &programRepository, &packageRepository, &transactionProgramRepository, &accessService, skdResultService)
	mailConfig := model.SendOtpConfig{
		SmtpHost:     initConfig.Get("GOMAIL_SMTP_HOST"),
		SmtpPort:     initConfig.Get("GOMAIL_SMTP_PORT"),
		SenderName:   initConfig.Get("GOMAIL_SENDER_NAME"),
		AuthEmail:    initConfig.Get("GOMAIL_AUTH_EMAIL"),
		AuthPassword: initConfig.Get("GOMAIL_AUTH_PASSWORD"),
	}
	weeklyReportService := &service.WeeklyReportService{
		DB:                           db,
		ProgramRepository:            &programRepository,
		TransactionProgramRepository: &transactionProgramRepository,
		PackageRepository:            &packageRepository,
		LiveClassRepository:          &liveClassRepository,
		MentoringRepository:          &mentoringRepository,
		SystemConfigRepository:       &systemConfigRepository,
		SKDResultService:             skdResultService,
		SendMail: func(to string, subject string, html string) error {
			return helper.SendMail(mailConfig, to, subject, html)
		},
		WebURL: initConfig.Get("WEB_BASE_URL"),
		Now:    time.Now,
	}
	tutorFeeService := &service.TutorFeeService{
		ProgramRepository:            &programRepository,
		OrderRepository:              &orderRepository,
		TransactionProgramRepository: &transactionProgramRepository,
		PackageRepository:            &packageRepository,
		LiveClassRepository:          &liveClassRepository,
		MentoringRepository:          &mentoringRepository,
		Now:                          time.Now,
	}
	analyticsService := &service.AnalyticsService{
		DB:                  db,
		TryoutRepository:    &tryoutRepository,
		LiveClassRepository: &liveClassRepository,
		SKDResultService:    skdResultService,
		Now:                 time.Now,
	}
	// Weekly progress email: Sunday 19:00 WIB.
	if err := scheduler.AddFunc("0 19 * * 0", func() {
		result, err := weeklyReportService.Run(context.Background(), "", false)
		if err != nil {
			log.Printf("weekly report run failed: %v", err)
			return
		}
		log.Printf("weekly report: %d sent, %d skipped, %d failed", result.Sent, result.Skipped, result.Failed)
	}); err != nil {
		log.Printf("failed to schedule weekly report: %v", err)
	}
	transactionProgramService := service.NewTransactionProgramService(&transactionProgramRepository, &programRepository)
	registerProgramService := service.NewRegisterProgramService(&userService, &programService, &transactionProgramService, &packageRepository, uploader)
	ebookService := service.NewEbookService(&ebookRepository, uploader)
	aiService := service.NewAIService(initConfig, &chatLogRepository, &aiExampleRepository, &chatArtifactRepository, &systemConfigRepository)
	extractionService := service.NewExtractionService(initConfig)
	bankSoalService := service.NewBankSoalService(&bankSoalRepository)
	learningVideoService := service.NewLearningVideoService(&learningVideoRepository)
	systemConfigService := service.NewSystemConfigService(&systemConfigRepository)

	userController := controller.NewUserController(&userService, initConfig)
	tryoutController := controller.NewTryoutController(&tryoutService, &accessService, initConfig)
	tryoutResultController := controller.NewTryoutResultController(&tryoutResultService, initConfig)
	questionController := controller.NewQuestionController(&questionService, &transactionTryoutService, &accessService, &tryoutRepository, initConfig)
	userAnswerController := controller.NewUserAnswerController(&userAnswerService, &transactionTryoutService, initConfig)
	transactionTryoutController := controller.NewTransactionTryoutController(&transactionTryoutService, &tryoutService, &tryoutResultService, &transactionProgramRepository, &accessService, skdResultService, initConfig)
	programController := controller.NewProgramController(&programService, initConfig)
	transactionProgramController := controller.NewTransactionProgramController(&transactionProgramService, initConfig)
	registerProgramController := controller.NewRegisterProgramController(&registerProgramService, initConfig)
	ebookController := controller.NewEbookController(&ebookService, initConfig)
	aiController := controller.NewAIController(&aiService, extractionService, initConfig)
	bankSoalController := controller.NewBankSoalController(&bankSoalService, initConfig)
	learningVideoController := controller.NewLearningVideoController(&learningVideoService, initConfig)
	systemConfigController := controller.NewSystemConfigController(systemConfigService, initConfig)
	adminController := controller.NewAdminController(scheduler, initConfig)
	packageController := controller.NewPackageController(&packageService, initConfig)
	orderController := controller.NewOrderController(&orderService, initConfig)
	skdResultController := controller.NewSKDResultController(skdResultService, initConfig)
	liveClassController := controller.NewLiveClassController(&liveClassService, initConfig)
	mentoringController := controller.NewMentoringController(&mentoringService, initConfig)
	analyticsController := controller.NewAnalyticsController(analyticsService, initConfig)
	growthController := controller.NewGrowthController(&growthService, weeklyReportService, tutorFeeService, &systemConfigRepository, initConfig)

	userController.Route(app)
	tryoutController.Route(app)
	tryoutResultController.Route(app)
	questionController.Route(app)
	userAnswerController.Route(app)
	transactionTryoutController.Route(app)
	programController.Route(app)
	transactionProgramController.Route(app)
	registerProgramController.Route(app)
	ebookController.Route(app)
	aiController.Route(app)
	learningVideoController.Route(app)
	bankSoalController.Route(app)
	systemConfigController.Route(app)
	adminController.Route(app)
	packageController.Route(app)
	orderController.Route(app)
	skdResultController.Route(app)
	liveClassController.Route(app)
	mentoringController.Route(app)
	growthController.Route(app)
	analyticsController.Route(app)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusCreated).JSON(model.GeneralResponse{
			Code:    200,
			Message: "Success",
			Data:    APP_VERSION,
		})
	})

	app.Get("/docs/*", swagger.HandlerDefault) // default

	err := app.Listen(initConfig.Get("SERVER") + ":" + initConfig.Get("PORT"))
	exception.PanicLogging(err)
}
