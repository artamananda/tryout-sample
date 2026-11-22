// Package payment talks to the payment bridge in the Novelle backend, which
// owns the Midtrans account and webhook (see backend/docs/payment-bridge.md).
//
//   - CreatePayment asks the bridge to create a Midtrans Snap transaction.
//   - GetStatus reads the authoritative status, which the bridge fetches from
//     the Midtrans Core API.
//
// The bridge pings our callback with only an order id; we then call GetStatus.
// Because the status always comes from the bridge we called ourselves, a forged
// ping cannot mark an order as paid, so no shared secret is needed.
package payment

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

// Bridge endpoints, relative to PAYMENT_BRIDGE_URL.
const (
	createPath = "/api/bridge/telisik/payments"
	statusPath = "/api/bridge/telisik/payments/"
)

// ErrNotConfigured is returned when PAYMENT_BRIDGE_URL is missing.
var ErrNotConfigured = errors.New("payment bridge is not configured")

type Customer struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
}

type Item struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Price    int    `json:"price"`
	Quantity int    `json:"quantity"`
}

// CreatePaymentRequest is sent to the bridge to create a Snap transaction.
type CreatePaymentRequest struct {
	Source            string   `json:"source"`
	OrderID           string   `json:"order_id"`
	GrossAmount       int      `json:"gross_amount"`
	Customer          Customer `json:"customer"`
	Items             []Item   `json:"items"`
	CallbackURL       string   `json:"callback_url"`
	FinishRedirectURL string   `json:"finish_redirect_url,omitempty"`
	ExpiryMinutes     int      `json:"expiry_minutes"`
}

// Session is what the bridge returns: the Snap token and the redirect URL.
type Session struct {
	Token       string `json:"token"`
	RedirectURL string `json:"redirect_url"`
}

// Status is the Midtrans status of one order, as reported by the bridge.
type Status struct {
	OrderID           string `json:"order_id"`
	TransactionStatus string `json:"transaction_status"`
	FraudStatus       string `json:"fraud_status"`
	GrossAmount       string `json:"gross_amount"`
	TransactionID     string `json:"transaction_id"`
	PaymentType       string `json:"payment_type"`
	SettlementTime    string `json:"settlement_time"`
}

// Gateway is implemented by BridgeClient; tests replace it.
type Gateway interface {
	CreatePayment(ctx context.Context, request CreatePaymentRequest) (Session, error)
	GetStatus(ctx context.Context, orderID string) (Status, error)
}

type BridgeClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewBridgeClient(baseURL string) *BridgeClient {
	return &BridgeClient{
		BaseURL:    strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (client *BridgeClient) do(ctx context.Context, method string, path string, body interface{}, out interface{}) error {
	if client.BaseURL == "" {
		return ErrNotConfigured
	}
	var reader io.Reader
	if body != nil {
		encoded, err := json.Marshal(body)
		if err != nil {
			return err
		}
		reader = bytes.NewReader(encoded)
	}
	request, err := http.NewRequestWithContext(ctx, method, client.BaseURL+path, reader)
	if err != nil {
		return err
	}
	request.Header.Set("Accept", "application/json")
	if body != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	response, err := client.HTTPClient.Do(request)
	if err != nil {
		return fmt.Errorf("payment bridge request failed: %w", err)
	}
	defer response.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("payment bridge returned %d: %s", response.StatusCode, truncate(string(data), 300))
	}
	if err := json.Unmarshal(data, out); err != nil {
		return fmt.Errorf("payment bridge response is not JSON: %s", truncate(string(data), 300))
	}
	return nil
}

func (client *BridgeClient) CreatePayment(ctx context.Context, request CreatePaymentRequest) (Session, error) {
	var session Session
	if err := client.do(ctx, http.MethodPost, createPath, request, &session); err != nil {
		return Session{}, err
	}
	if session.Token == "" && session.RedirectURL == "" {
		return Session{}, errors.New("payment bridge response has no token or redirect_url")
	}
	return session, nil
}

func (client *BridgeClient) GetStatus(ctx context.Context, orderID string) (Status, error) {
	var status Status
	err := client.do(ctx, http.MethodGet, statusPath+url.PathEscape(orderID), nil, &status)
	return status, err
}

func truncate(text string, max int) string {
	if len(text) <= max {
		return text
	}
	return text[:max] + "..."
}

// Order statuses that a Midtrans status maps to.
const (
	StatusPaid      = "PAID"
	StatusPending   = "PENDING"
	StatusExpired   = "EXPIRED"
	StatusCancelled = "CANCELLED"
	StatusFailed    = "FAILED"
)

// MapMidtransStatus converts transaction_status/fraud_status to an order status.
// It returns "" for statuses that should not change the order (e.g. refunds,
// which are handled by hand).
func MapMidtransStatus(transactionStatus string, fraudStatus string) string {
	switch strings.ToLower(strings.TrimSpace(transactionStatus)) {
	case "settlement":
		return StatusPaid
	case "capture":
		if fraud := strings.ToLower(strings.TrimSpace(fraudStatus)); fraud == "" || fraud == "accept" {
			return StatusPaid
		}
		return StatusPending
	case "pending":
		return StatusPending
	case "expire":
		return StatusExpired
	case "cancel":
		return StatusCancelled
	case "deny", "failure":
		return StatusFailed
	default:
		return ""
	}
}

// ParseAmount reads a Midtrans amount such as "279000.00" as whole rupiah.
func ParseAmount(value string) (int, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, errors.New("empty amount")
	}
	amount, err := strconv.ParseFloat(value, 64)
	if err != nil {
		return 0, err
	}
	return int(math.Round(amount)), nil
}
