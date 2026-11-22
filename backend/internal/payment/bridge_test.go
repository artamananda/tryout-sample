package payment

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestVerifyCallback(t *testing.T) {
	now := time.Unix(1_800_000_000, 0)
	body := []byte(`{"order_id":"TLS-1","transaction_status":"settlement"}`)
	ts := strconv.FormatInt(now.Unix(), 10)
	signature := Sign("secret", ts, body)

	assert.NoError(t, VerifyCallback("secret", ts, signature, body, now))
	assert.ErrorIs(t, VerifyCallback("secret", ts, signature, []byte(`{"order_id":"TLS-2"}`), now), ErrBadSignature, "tampered body")
	assert.ErrorIs(t, VerifyCallback("other", ts, signature, body, now), ErrBadSignature, "wrong secret")
	assert.ErrorIs(t, VerifyCallback("secret", ts, signature, body, now.Add(10*time.Minute)), ErrStaleCallback, "replayed later")
	assert.ErrorIs(t, VerifyCallback("secret", "", signature, body, now), ErrMissingSignature)
	assert.ErrorIs(t, VerifyCallback("", ts, signature, body, now), ErrNotConfigured, "no secret configured")
}

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
		assert.Equal(t, "Bearer key-123", r.Header.Get("Authorization"))
		assert.NoError(t, json.NewDecoder(r.Body).Decode(&received))
		// The bridge may wrap its answer; the client must still find it.
		_, _ = w.Write([]byte(`{"code":200,"data":{"token":"snap-abc","redirect_url":"https://app.midtrans.com/snap/v4/redirection/snap-abc"}}`))
	}))
	defer server.Close()

	client := NewBridgeClient(server.URL, "key-123")
	session, err := client.CreatePayment(context.Background(), CreatePaymentRequest{OrderID: "TLS-1", GrossAmount: 50000})
	assert.NoError(t, err)
	assert.Equal(t, "snap-abc", session.Token)
	assert.Contains(t, session.RedirectURL, "snap-abc")
	assert.Equal(t, "TLS-1", received.OrderID)
	assert.Equal(t, 50000, received.GrossAmount)
}

func TestBridgeClientErrors(t *testing.T) {
	_, err := NewBridgeClient("", "").CreatePayment(context.Background(), CreatePaymentRequest{})
	assert.ErrorIs(t, err, ErrNotConfigured)

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadGateway)
	}))
	defer server.Close()
	_, err = NewBridgeClient(server.URL, "k").CreatePayment(context.Background(), CreatePaymentRequest{})
	assert.Error(t, err)
}
