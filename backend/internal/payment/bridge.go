// Package payment talks to the Midtrans bridge: an API of another business
// system that owns the Midtrans account and webhook. This API asks the bridge
// to create a payment, and the bridge calls back when the status changes.
package payment

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// ErrNotConfigured is returned when the bridge URL or key is missing.
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

// CreatePaymentRequest is sent to the bridge to create a Midtrans transaction.
type CreatePaymentRequest struct {
	Source            string   `json:"source"`
	OrderID           string   `json:"order_id"`
	GrossAmount       int      `json:"gross_amount"`
	Customer          Customer `json:"customer"`
	Items             []Item   `json:"items"`
	CallbackURL       string   `json:"callback_url"`
	FinishRedirectURL string   `json:"finish_redirect_url"`
	ExpiryMinutes     int      `json:"expiry_minutes"`
}

// Session is what the bridge returns: the Snap token and/or the redirect URL.
type Session struct {
	Token       string
	RedirectURL string
}

// Gateway creates payments. It is an interface so tests can replace it.
type Gateway interface {
	CreatePayment(ctx context.Context, request CreatePaymentRequest) (Session, error)
}

type BridgeClient struct {
	URL        string
	APIKey     string
	HTTPClient *http.Client
}

func NewBridgeClient(url string, apiKey string) *BridgeClient {
	return &BridgeClient{
		URL:        strings.TrimSpace(url),
		APIKey:     strings.TrimSpace(apiKey),
		HTTPClient: &http.Client{Timeout: 20 * time.Second},
	}
}

func (client *BridgeClient) CreatePayment(ctx context.Context, request CreatePaymentRequest) (Session, error) {
	if client.URL == "" || client.APIKey == "" {
		return Session{}, ErrNotConfigured
	}

	body, err := json.Marshal(request)
	if err != nil {
		return Session{}, err
	}

	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, client.URL, bytes.NewReader(body))
	if err != nil {
		return Session{}, err
	}
	httpRequest.Header.Set("Content-Type", "application/json")
	httpRequest.Header.Set("Authorization", "Bearer "+client.APIKey)

	response, err := client.HTTPClient.Do(httpRequest)
	if err != nil {
		return Session{}, fmt.Errorf("payment bridge request failed: %w", err)
	}
	defer response.Body.Close()

	responseBody, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return Session{}, fmt.Errorf("payment bridge returned %d: %s", response.StatusCode, truncate(string(responseBody), 300))
	}

	session := parseSession(responseBody)
	if session.Token == "" && session.RedirectURL == "" {
		return Session{}, fmt.Errorf("payment bridge response has no token or redirect_url: %s", truncate(string(responseBody), 300))
	}
	return session, nil
}

// parseSession accepts {"token","redirect_url"} at the top level or wrapped in
// "data" or "payload", since the bridge belongs to another system.
func parseSession(body []byte) Session {
	var raw map[string]json.RawMessage
	if json.Unmarshal(body, &raw) != nil {
		return Session{}
	}
	read := func(fields map[string]json.RawMessage) Session {
		var session Session
		for _, key := range []string{"token", "snap_token"} {
			if value, ok := fields[key]; ok && session.Token == "" {
				_ = json.Unmarshal(value, &session.Token)
			}
		}
		for _, key := range []string{"redirect_url", "payment_url"} {
			if value, ok := fields[key]; ok && session.RedirectURL == "" {
				_ = json.Unmarshal(value, &session.RedirectURL)
			}
		}
		return session
	}
	if session := read(raw); session.Token != "" || session.RedirectURL != "" {
		return session
	}
	for _, wrapper := range []string{"data", "payload"} {
		if inner, ok := raw[wrapper]; ok {
			var fields map[string]json.RawMessage
			if json.Unmarshal(inner, &fields) == nil {
				if session := read(fields); session.Token != "" || session.RedirectURL != "" {
					return session
				}
			}
		}
	}
	return Session{}
}

func truncate(text string, max int) string {
	if len(text) <= max {
		return text
	}
	return text[:max] + "..."
}

// Callback signing: the bridge sends
//
//	X-Callback-Timestamp: <unix seconds>
//	X-Callback-Signature: hex(HMAC-SHA256(secret, "<timestamp>.<raw body>"))
//
// and the timestamp must be within CallbackTolerance of now.
const CallbackTolerance = 5 * time.Minute

var (
	ErrMissingSignature = errors.New("missing callback signature")
	ErrStaleCallback    = errors.New("callback timestamp is too old or in the future")
	ErrBadSignature     = errors.New("invalid callback signature")
)

// Sign returns the signature the bridge must send for body at timestamp.
func Sign(secret string, timestamp string, body []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

// VerifyCallback checks the timestamp window and the HMAC of a callback.
func VerifyCallback(secret string, timestamp string, signature string, body []byte, now time.Time) error {
	if secret == "" {
		return ErrNotConfigured
	}
	if timestamp == "" || signature == "" {
		return ErrMissingSignature
	}
	seconds, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return ErrStaleCallback
	}
	if math.Abs(now.Sub(time.Unix(seconds, 0)).Seconds()) > CallbackTolerance.Seconds() {
		return ErrStaleCallback
	}
	expected := Sign(secret, timestamp, body)
	if !hmac.Equal([]byte(expected), []byte(strings.ToLower(strings.TrimSpace(signature)))) {
		return ErrBadSignature
	}
	return nil
}

// Midtrans transaction statuses mapped to order statuses.
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
