package payment

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMapMidtransStatus(t *testing.T) {
	cases := map[[2]string]string{
		{"settlement", ""}:       StatusPaid,
		{"capture", "accept"}:    StatusPaid,
		{"capture", "challenge"}: StatusPending,
		{"pending", ""}:          StatusPending,
		{"expire", ""}:           StatusExpired,
		{"cancel", ""}:           StatusCancelled,
		{"deny", ""}:             StatusFailed,
		{"refund", ""}:           "",
	}
	for input, expected := range cases {
		assert.Equal(t, expected, MapMidtransStatus(input[0], input[1]), input)
	}
}

func TestParseAmount(t *testing.T) {
	amount, err := ParseAmount("279000.00")
	assert.NoError(t, err)
	assert.Equal(t, 279000, amount)
	_, err = ParseAmount("")
	assert.Error(t, err)
}

func TestBridgeClientCreatePayment(t *testing.T) {
	var received CreatePaymentRequest
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodPost, r.Method)
		assert.Equal(t, "/api/bridge/telisik/payments", r.URL.Path)
		assert.NoError(t, json.NewDecoder(r.Body).Decode(&received))
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"token":"snap-abc","redirect_url":"https://app.midtrans.com/snap/v4/redirection/snap-abc"}`))
	}))
	defer server.Close()

	// A trailing slash in PAYMENT_BRIDGE_URL is tolerated.
	client := NewBridgeClient(server.URL + "/")
	session, err := client.CreatePayment(context.Background(), CreatePaymentRequest{OrderID: "TLS-1", GrossAmount: 50000})
	assert.NoError(t, err)
	assert.Equal(t, "snap-abc", session.Token)
	assert.Contains(t, session.RedirectURL, "snap-abc")
	assert.Equal(t, "TLS-1", received.OrderID)
	assert.Equal(t, 50000, received.GrossAmount)
}

func TestBridgeClientGetStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, http.MethodGet, r.Method)
		assert.Equal(t, "/api/bridge/telisik/payments/TLS-261123-ABC123", r.URL.Path)
		_, _ = w.Write([]byte(`{"order_id":"TLS-261123-ABC123","transaction_status":"settlement","fraud_status":"accept","gross_amount":"50000.00","payment_type":"qris"}`))
	}))
	defer server.Close()

	status, err := NewBridgeClient(server.URL).GetStatus(context.Background(), "TLS-261123-ABC123")
	assert.NoError(t, err)
	assert.Equal(t, "settlement", status.TransactionStatus)
	assert.Equal(t, "50000.00", status.GrossAmount)
	assert.Equal(t, "qris", status.PaymentType)
}

func TestBridgeClientErrors(t *testing.T) {
	_, err := NewBridgeClient("").CreatePayment(context.Background(), CreatePaymentRequest{})
	assert.ErrorIs(t, err, ErrNotConfigured)
	_, err = NewBridgeClient("  ").GetStatus(context.Background(), "TLS-1")
	assert.ErrorIs(t, err, ErrNotConfigured)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"error":"payment not found"}`))
			return
		}
		_, _ = w.Write([]byte(`{}`)) // 200 without a token
	}))
	defer server.Close()
	_, err = NewBridgeClient(server.URL).CreatePayment(context.Background(), CreatePaymentRequest{})
	assert.Error(t, err)
	_, err = NewBridgeClient(server.URL).GetStatus(context.Background(), "TLS-1")
	assert.ErrorContains(t, err, "404")
}
