package main

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/controller"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/swagger"

	_ "github.com/artamananda/tryout-sample/docs"
)

const APP_VERSION = "0.0.28"

// @title Tryout Sample
// @version 0.0.28
// @description API Documentation for Telisik Tryout
// @termsOfService http://swagger.io/terms/
// @contact.name Artamananda
// @contact.email artamananda@gmail.com
// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html
// @host localhost:8080
// @BasePath /v1/api
// @securityDefinitions.apiKey JWT
// @in header
// @name Authorization
// @externalDocs.description OpenAPI
// @externalDocs.url https://swagger.io/resources/open-api/
func main() {
	initConfig := config.New()
	db := config.NewDB(initConfig)
	app := fiber.New()
	sess, _ := config.NewSession(initConfig)
	uploader := s3manager.NewUploader(sess)

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

	userService := service.NewUserService(&userRepository)
	tryoutService := service.NewTryoutService(&tryoutRepository)
	questionService := service.NewQuestionService(&questionRepository, uploader)
	userAnswerService := service.NewUserAnswerService(&userAnswerRepository)
	transactionTryoutService := service.NewTransactionTryoutService(&transactionRepository)

	userController := controller.NewUserController(&userService, initConfig)
	tryoutController := controller.NewTryoutController(&tryoutService, initConfig)
	questionController := controller.NewQuestionController(&questionService, initConfig)
	userAnswerController := controller.NewUserAnswerController(&userAnswerService, initConfig)
	transactionTryoutController := controller.NewTransactionTryoutController(&transactionTryoutService, &tryoutService, initConfig)

	userController.Route(app)
	tryoutController.Route(app)
	questionController.Route(app)
	userAnswerController.Route(app)
	transactionTryoutController.Route(app)

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
