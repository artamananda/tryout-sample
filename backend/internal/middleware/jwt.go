package middleware

import (
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/gofiber/fiber/v2"
	jwtware "github.com/gofiber/jwt/v3"
	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
)

const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// AuthUser is the identity carried by a validated JWT.
type AuthUser struct {
	UserID   string
	Username string
	Role     string
}

func (authUser AuthUser) IsAdmin() bool {
	return authUser.Role == RoleAdmin
}

// GetAuthUser reads the identity that AuthenticateJWT stored on the request.
// It returns false when the route is not protected or the claims are malformed.
func GetAuthUser(ctx *fiber.Ctx) (AuthUser, bool) {
	token, ok := ctx.Locals("user").(*jwt.Token)
	if !ok || token == nil {
		return AuthUser{}, false
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return AuthUser{}, false
	}
	userID, _ := claims["user_id"].(string)
	username, _ := claims["username"].(string)
	role, _ := claims["roles"].(string)
	if role == "" {
		return AuthUser{}, false
	}
	if _, err := uuid.Parse(userID); err != nil {
		return AuthUser{}, false
	}
	return AuthUser{UserID: userID, Username: username, Role: role}, true
}

func AuthenticateJWT(roles []string, config config.Config) func(*fiber.Ctx) error {
	jwtSecret := config.Get("JWT_SECRET_KEY")
	return jwtware.New(jwtware.Config{
		SigningKey: []byte(jwtSecret),
		SuccessHandler: func(ctx *fiber.Ctx) error {
			authUser, ok := GetAuthUser(ctx)
			if ok {
				for _, val := range roles {
					if val == authUser.Role {
						return ctx.Next()
					}
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
			}
			return c.
				Status(fiber.StatusUnauthorized).
				JSON(model.GeneralResponse{
					Code:    401,
					Message: "Unauthorized",
					Data:    "Invalid or expired JWT",
				})
		},
	})
}
