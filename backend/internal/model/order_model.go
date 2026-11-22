package model

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CreateOrderRequest struct {
	PackageID    uuid.UUID `json:"package_id" validate:"required"`
	ReferralCode string    `json:"referral_code" validate:"max=12"`
}

type OrderPackageSummary struct {
	PackageID uuid.UUID `json:"package_id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
}

type OrderUserSummary struct {
	UserID      uuid.UUID `json:"user_id"`
	Name        string    `json:"name"`
	Email       string    `json:"email"`
	PhoneNumber string    `json:"phone_number"`
}

type OrderResponse struct {
	OrderID           uuid.UUID           `json:"order_id"`
	OrderNumber       string              `json:"order_number"`
	Status            string              `json:"status"`
	Amount            int                 `json:"amount"`
	ListPrice         int                 `json:"list_price"`
	Discount          int                 `json:"discount"`
	ReferralCode      string              `json:"referral_code,omitempty"`
	IsUpgrade         bool                `json:"is_upgrade"`
	ProgramID         uuid.UUID           `json:"program_id"`
	Package           OrderPackageSummary `json:"package"`
	User              *OrderUserSummary   `json:"user,omitempty"`
	PaymentProvider   string              `json:"payment_provider"`
	PaymentToken      string              `json:"payment_token,omitempty"`
	PaymentURL        string              `json:"payment_url,omitempty"`
	PaymentMethod     string              `json:"payment_method"`
	ProviderReference string              `json:"provider_reference,omitempty"`
	ExpiresAt         *time.Time          `json:"expires_at"`
	PaidAt            *time.Time          `json:"paid_at"`
	CreatedAt         time.Time           `json:"created_at"`
}

type FindAllOrdersRequest struct {
	ProgramID string `query:"program_id"`
	PackageID string `query:"package_id"`
	Status    string `query:"status"`
	Search    string `query:"search"`
	Limit     int    `query:"limit"`
	Offset    int    `query:"offset"`
}

// PaymentCallbackRequest is what the Midtrans bridge forwards. Field names
// follow the Midtrans notification so the bridge can pass it through as-is.
type PaymentCallbackRequest struct {
	OrderID           string         `json:"order_id"`
	TransactionStatus string         `json:"transaction_status"`
	FraudStatus       string         `json:"fraud_status"`
	GrossAmount       FlexibleString `json:"gross_amount"`
	TransactionID     string         `json:"transaction_id"`
	PaymentType       string         `json:"payment_type"`
	SettlementTime    string         `json:"settlement_time"`
}

type MarkOrderPaidRequest struct {
	PaymentMethod string `json:"payment_method" validate:"max=50"`
	Reference     string `json:"reference" validate:"max=100"`
}

// FlexibleString accepts a JSON string or number ("279000.00" or 279000).
type FlexibleString string

func (value *FlexibleString) UnmarshalJSON(data []byte) error {
	text := strings.TrimSpace(string(data))
	if text == "null" {
		*value = ""
		return nil
	}
	if strings.HasPrefix(text, "\"") {
		var parsed string
		if err := json.Unmarshal(data, &parsed); err != nil {
			return err
		}
		*value = FlexibleString(parsed)
		return nil
	}
	var number json.Number
	if err := json.Unmarshal(data, &number); err != nil {
		return err
	}
	*value = FlexibleString(number.String())
	return nil
}
