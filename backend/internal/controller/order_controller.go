package controller

import (
	"net/url"
	"strings"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/middleware"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/service"
	"github.com/gofiber/fiber/v2"
)

type OrderController struct {
	OrderService *service.OrderService
	config.Config
}

func NewOrderController(orderService *service.OrderService, config config.Config) *OrderController {
	return &OrderController{OrderService: orderService, Config: config}
}

func (controller OrderController) Route(app *fiber.App) {
	adminOnly := middleware.AuthenticateJWT([]string{middleware.RoleAdmin}, controller.Config)
	loggedIn := middleware.AuthenticateJWT([]string{middleware.RoleAdmin, middleware.RoleUser}, controller.Config)

	app.Post("/v1/api/order", loggedIn, middleware.RateLimit(20, 10*60), controller.Checkout)
	app.Get("/v1/api/order/me", loggedIn, controller.ListMine)
	app.Get("/v1/api/order", adminOnly, controller.ListAll)
	app.Get("/v1/api/order/:number", loggedIn, controller.FindByNumber)
	app.Patch("/v1/api/order/:id/mark-paid", adminOnly, controller.MarkPaid)

	// Pinged by the payment bridge (Novelle); the status is fetched back from it.
	app.Post("/v1/api/payment/callback", middleware.RateLimit(120, 60), controller.PaymentCallback)
}

// Checkout creates an order for a package: free packages are granted at once,
// paid ones return a Midtrans payment link.
// @Summary Order a package
// @Tags Orders
// @Accept json
// @Produce json
// @Param request body model.CreateOrderRequest true "Request Body"
// @Security JWT
// @Success 201 {object} model.GeneralResponse
// @Router /order [post]
func (controller OrderController) Checkout(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	var request model.CreateOrderRequest
	if err := parseBody(c, &request); err != nil {
		return err
	}
	result, err := controller.OrderService.Checkout(c.Context(), authUser.UserID, request, controller.checkoutLinks(c))
	if err != nil {
		return err
	}
	return success(c, fiber.StatusCreated, result)
}

// ListMine lists the orders of the logged-in user.
// @Summary My orders
// @Tags Orders
// @Produce json
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /order/me [get]
func (controller OrderController) ListMine(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.OrderService.ListForUser(c.Context(), authUser.UserID)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": len(result), "results": result})
}

// FindByNumber returns one order. Participants can only read their own.
// @Summary Get an order by number
// @Tags Orders
// @Produce json
// @Param number path string true "Order number (TLS-...)"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /order/{number} [get]
func (controller OrderController) FindByNumber(c *fiber.Ctx) error {
	authUser, err := requireAuthUser(c)
	if err != nil {
		return err
	}
	result, err := controller.OrderService.FindForUser(c.Context(), authUser.UserID, c.Params("number"), authUser.IsAdmin())
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// ListAll lists orders for admins.
// @Summary List orders (admin)
// @Tags Orders
// @Produce json
// @Param program_id query string false "Program ID"
// @Param package_id query string false "Package ID"
// @Param status query string false "PENDING, PAID, EXPIRED, CANCELLED, FAILED"
// @Param search query string false "Order number, name, email or phone"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /order [get]
func (controller OrderController) ListAll(c *fiber.Ctx) error {
	var request model.FindAllOrdersRequest
	if err := c.QueryParser(&request); err != nil {
		return exception.BadRequestError{Message: "query tidak valid"}
	}
	result, total, err := controller.OrderService.ListAll(c.Context(), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, map[string]interface{}{"count": total, "results": result})
}

// MarkPaid confirms a payment by hand and grants the package.
// @Summary Mark an order as paid (admin)
// @Tags Orders
// @Accept json
// @Produce json
// @Param id path string true "Order ID"
// @Param request body model.MarkOrderPaidRequest true "Request Body"
// @Security JWT
// @Success 200 {object} model.GeneralResponse
// @Router /order/{id}/mark-paid [patch]
func (controller OrderController) MarkPaid(c *fiber.Ctx) error {
	var request model.MarkOrderPaidRequest
	if len(c.Body()) > 0 {
		if err := parseBody(c, &request); err != nil {
			return err
		}
	}
	result, err := controller.OrderService.MarkPaid(c.Context(), c.Params("id"), request)
	if err != nil {
		return err
	}
	return success(c, fiber.StatusOK, result)
}

// PaymentCallback receives a ping from the payment bridge (Novelle) saying an
// order changed. The status is then fetched from the bridge, never taken from
// the request, so the endpoint needs no signature.
// @Summary Payment ping from the bridge
// @Description Body: {"order_id": "TLS-..."}. Triggers a status sync of that order.
// @Tags Orders
// @Accept json
// @Produce json
// @Success 200 {object} model.GeneralResponse
// @Router /payment/callback [post]
func (controller OrderController) PaymentCallback(c *fiber.Ctx) error {
	if err := controller.OrderService.HandleCallback(c.Context(), c.Body()); err != nil {
		return err
	}
	return success(c, fiber.StatusOK, nil)
}

// checkoutLinks derives the bridge URLs from the request: the callback goes to
// this API's own host, and the buyer returns to the web origin that started
// the checkout (WEB_BASE_URL when the request has no usable Origin).
func (controller OrderController) checkoutLinks(c *fiber.Ctx) service.CheckoutLinks {
	links := service.CheckoutLinks{CallbackURL: strings.TrimRight(c.BaseURL(), "/") + "/v1/api/payment/callback"}

	web := ""
	if origin, err := url.Parse(c.Get(fiber.HeaderOrigin)); err == nil && (origin.Scheme == "https" || origin.Scheme == "http") && origin.Host != "" {
		web = origin.Scheme + "://" + origin.Host
	} else if base := strings.TrimRight(controller.Config.Get("WEB_BASE_URL"), "/"); base != "" {
		web = base
	}
	if web != "" {
		links.FinishURL = web + "/pesanan/{order_number}"
	}
	return links
}
