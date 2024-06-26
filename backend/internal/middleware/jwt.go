package middleware

import (
	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
	jwtware "github.com/gofiber/jwt/v3"
	"github.com/golang-jwt/jwt/v4"
)

func AuthenticateJWT(roles []string, config config.Config) func(*fiber.Ctx) error {
	jwtSecret := config.Get("JWT_SECRET_KEY")
	return jwtware.New(jwtware.Config{
		SigningKey: []byte(jwtSecret),
		SuccessHandler: func(ctx *fiber.Ctx) error {
			user := ctx.Locals("user").(*jwt.Token)
			claims := user.Claims.(jwt.MapClaims)
			role := claims["roles"].(string)

			common.NewLogger().Info("role function ", roles, " role user ", role)

			for _, val := range roles {
				if val == role {
					return ctx.Next()
				}
			}

			return ctx.
				Status(fiber.StatusUnauthorized).
				JSON(model.GeneralResponse{
					Code:    401,
					Message: "Unauthorized",
					Data:    "Invalid Role",
				})
		},
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			if err.Error() == "Missing or malformed JWT" {
				return c.
					Status(fiber.StatusBadRequest).
					JSON(model.GeneralResponse{
						Code:    400,
						Message: "Bad Request",
						Data:    "Missing or malformed JWT",
					})
			} else {
				return c.
					Status(fiber.StatusUnauthorized).
					JSON(model.GeneralResponse{
						Code:    401,
						Message: "Unauthorized",
						Data:    "Invalid or expired JWT",
					})
			}
		},
	})
}
