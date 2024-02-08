package main

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/controller"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

func main() {
	initConfig := config.New()
	db := config.NewDB(initConfig)

	userRepository := repository.NewUserRepository(db)
	tryoutRepository := repository.NewTryoutRepository(db)
	questionRepository := repository.NewQuestionRepository(db)
	userAnswerRepository := repository.NewUserAnswerRepository(db)

	userService := service.NewUserService(&userRepository)
	tryoutService := service.NewTryoutService(&tryoutRepository)
	questionService := service.NewQuestionService(&questionRepository)
	userAnswerService := service.NewUserAnswerService(&userAnswerRepository)

	userController := controller.NewUserController(&userService, initConfig)
	tryoutController := controller.NewTryoutController(&tryoutService, initConfig)
	questionController := controller.NewQuestionController(&questionService, initConfig)
	userAnswerController := controller.NewUserAnswerController(&userAnswerService, initConfig)

	app := fiber.New()

	userController.Route(app)
	tryoutController.Route(app)
	questionController.Route(app)
	userAnswerController.Route(app)

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, Fiber!")
	})

	app.Get("/hello/:name", func(c *fiber.Ctx) error {
		name := c.Params("name")
		return c.SendString("Hello, " + name + "!")
	})

	err := app.Listen(initConfig.Get("SERVER") + ":" + initConfig.Get("PORT"))
	exception.PanicLogging(err)
}
