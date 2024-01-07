package main

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/gofiber/fiber/v2"
)

func main() {
	newConfig := config.New()
	config.NewDB(newConfig)

	app := fiber.New()

	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("Hello, Fiber!")
	})

	app.Get("/hello/:name", func(c *fiber.Ctx) error {
		name := c.Params("name")
		return c.SendString("Hello, " + name + "!")
	})

	err := app.Listen(newConfig.Get("SERVER.PORT"))
	exception.PanicLogging(err)
}
