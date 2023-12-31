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

	userService := service.NewUserService(&userRepository)

	userController := controller.NewUserController(&userService, initConfig)

	app := fiber.New()

	userController.Route(app)

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
