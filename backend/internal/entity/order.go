package entity

import (
	"time"

	"github.com/google/uuid"
)

// Order statuses.
const (
	OrderPending   = "PENDING"
	OrderPaid      = "PAID"
	OrderExpired   = "EXPIRED"
	OrderCancelled = "CANCELLED"
	OrderFailed    = "FAILED"
)

// Payment providers recorded on an order.
const (
	PaymentProviderFree   = "free"
	PaymentProviderBridge = "midtrans_bridge"
	PaymentProviderManual = "manual"
)

type Order struct {
	OrderID           uuid.UUID  `gorm:"primaryKey;default:gen_random_uuid()" json:"order_id"`
	OrderNumber       string     `json:"order_number"`
	UserID            uuid.UUID  `json:"user_id"`
	User              User       `gorm:"foreignKey:UserID;references:UserID" json:"-"`
	PackageID         uuid.UUID  `json:"package_id"`
	Package           Package    `gorm:"foreignKey:PackageID;references:PackageID" json:"-"`
	ProgramID         uuid.UUID  `json:"program_id"`
	Amount            int        `json:"amount"`
	Status            string     `json:"status"`
	PhoneNumber       string     `json:"phone_number"`
	PaymentProvider   string     `json:"payment_provider"`
	PaymentToken      string     `json:"payment_token"`
	PaymentURL        string     `json:"payment_url"`
	PaymentMethod     string     `json:"payment_method"`
	ProviderReference string     `json:"provider_reference"`
	LastCallback      []byte     `gorm:"type:jsonb" json:"-"`
	ExpiresAt         *time.Time `json:"expires_at"`
	PaidAt            *time.Time `json:"paid_at"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

func (Order) TableName() string {
	return "orders"
}
