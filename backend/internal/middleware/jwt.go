package middleware

import (
	"strings"

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

// OptionalJWT reads a valid Bearer token when one is sent, so GetAuthUser
// works, but lets anonymous requests through. Invalid tokens are ignored.
func OptionalJWT(config config.Config) fiber.Handler {
	secret := []byte(config.Get("JWT_SECRET_KEY"))
	return func(ctx *fiber.Ctx) error {
		header := ctx.Get(fiber.HeaderAuthorization)
		if len(header) > 7 && strings.EqualFold(header[:7], "Bearer ") {
			token, err := jwt.Parse(header[7:], func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return secret, nil
			})
			if err == nil && token.Valid {
				ctx.Locals("user", token)
			}
		}
		return ctx.Next()
	}
}
