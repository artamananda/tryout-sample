package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/payment"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// OrderConfig holds the payment settings read from the environment.
type OrderConfig struct {
	CallbackURL       string
	FinishRedirectURL string
	CallbackSecret    string
	ExpiryMinutes     int
}

type OrderService struct {
	OrderRepository              *repository.OrderRepository
	PackageRepository            *repository.PackageRepository
	ProgramRepository            *repository.ProgramRepository
	UserRepository               *repository.UserRepository
	TransactionProgramRepository *repository.TransactionProgramRepository
	AccessService                *AccessService
	Gateway                      payment.Gateway
	Config                       OrderConfig
	Now                          func() time.Time
}

func NewOrderService(
	orderRepository *repository.OrderRepository,
	packageRepository *repository.PackageRepository,
	programRepository *repository.ProgramRepository,
	userRepository *repository.UserRepository,
	transactionProgramRepository *repository.TransactionProgramRepository,
	accessService *AccessService,
	gateway payment.Gateway,
	config OrderConfig,
) OrderService {
	if config.ExpiryMinutes <= 0 {
		config.ExpiryMinutes = 24 * 60
	}
	return OrderService{
		OrderRepository:              orderRepository,
		PackageRepository:            packageRepository,
		ProgramRepository:            programRepository,
		UserRepository:               userRepository,
		TransactionProgramRepository: transactionProgramRepository,
		AccessService:                accessService,
		Gateway:                      gateway,
		Config:                       config,
		Now:                          time.Now,
	}
}

// newOrderNumber builds a readable, unique order id. The TLS prefix keeps
// TELISIK orders apart from the other business that shares the Midtrans account.
func newOrderNumber(now time.Time) string {
	return fmt.Sprintf("TLS-%s-%s", now.In(wib).Format("060102"), strings.ToUpper(uuid.New().String()[:8]))
}

func toOrderResponse(order entity.Order, includeUser bool, now time.Time) model.OrderResponse {
	status := order.Status
	if status == entity.OrderPending && order.ExpiresAt != nil && !now.Before(*order.ExpiresAt) {
		status = entity.OrderExpired
	}
	response := model.OrderResponse{
		OrderID:           order.OrderID,
		OrderNumber:       order.OrderNumber,
		Status:            status,
		Amount:            order.Amount,
		ProgramID:         order.ProgramID,
		PaymentProvider:   order.PaymentProvider,
		PaymentMethod:     order.PaymentMethod,
		ProviderReference: order.ProviderReference,
		ExpiresAt:         order.ExpiresAt,
		PaidAt:            order.PaidAt,
		CreatedAt:         order.CreatedAt,
		Package: model.OrderPackageSummary{
			PackageID: order.PackageID,
			Code:      order.Package.Code,
			Name:      order.Package.Name,
		},
	}
	// The payment link is only useful while the order can still be paid.
	if status == entity.OrderPending {
		response.PaymentToken = order.PaymentToken
		response.PaymentURL = order.PaymentURL
	}
	if includeUser {
		response.User = &model.OrderUserSummary{
			UserID:      order.User.UserID,
			Name:        order.User.Name,
			Email:       order.User.Email,
			PhoneNumber: order.PhoneNumber,
		}
	}
	return response
}

// Checkout creates an order for the package. Free packages are granted at
// once; paid ones get a Midtrans payment through the bridge.
func (service *OrderService) Checkout(ctx context.Context, userID string, request model.CreateOrderRequest) (model.OrderResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.OrderResponse{}, err
	}
	now := service.Now()

	user, err := service.UserRepository.FindById(ctx, userID)
	if err != nil {
		return model.OrderResponse{}, exception.NotFoundError{Message: "user Not Found"}
	}
	if user.PhoneNumber == "" {
		return model.OrderResponse{}, exception.BadRequestError{Message: "Lengkapi nomor WhatsApp di profil sebelum memilih paket."}
	}

	pkg, err := service.PackageRepository.FindByID(ctx, request.PackageID)
	if err != nil || !pkg.IsActive {
		return model.OrderResponse{}, exception.NotFoundError{Message: "paket tidak ditemukan"}
	}
	program, err := service.ProgramRepository.FindByID(ctx, pkg.ProgramID)
	if err != nil {
		return model.OrderResponse{}, exception.NotFoundError{Message: "program Not Found"}
	}
	if !IsRegistrationOpen(program, now) {
		return model.OrderResponse{}, exception.BadRequestError{Message: "Pendaftaran program ini sedang ditutup."}
	}

	memberships, err := service.AccessService.Memberships(ctx, userID)
	if err != nil {
		return model.OrderResponse{}, err
	}
	if membership, ok := memberships[pkg.ProgramID]; ok {
		if membership.Package == nil {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Anda sudah terdaftar penuh di program ini."}
		}
		if membership.Package.PackageID == pkg.PackageID {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Anda sudah memiliki paket ini."}
		}
		if pkg.SortOrder <= membership.Package.SortOrder {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Anda sudah memiliki paket " + membership.Package.Name + ". Pilih paket yang lebih tinggi untuk meningkatkan."}
		}
	}

	amount := pkg.CurrentPrice(now)
	if amount == 0 {
		return service.claimFree(ctx, user, pkg, now)
	}

	// Reuse an unpaid order so repeated clicks do not create duplicates.
	if open, ok := service.OrderRepository.FindOpenOrder(ctx, user.UserID, pkg.PackageID, now); ok && open.Amount == amount && (open.PaymentURL != "" || open.PaymentToken != "") {
		order, err := service.OrderRepository.FindByID(ctx, open.OrderID)
		if err != nil {
			return model.OrderResponse{}, err
		}
		return toOrderResponse(order, false, now), nil
	}

	expiresAt := now.Add(time.Duration(service.Config.ExpiryMinutes) * time.Minute)
	var order entity.Order
	err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := service.ensureQuota(ctx, tx, pkg, now); err != nil {
			return err
		}
		order = entity.Order{
			OrderID:         uuid.New(),
			OrderNumber:     newOrderNumber(now),
			UserID:          user.UserID,
			PackageID:       pkg.PackageID,
			ProgramID:       pkg.ProgramID,
			Amount:          amount,
			Status:          entity.OrderPending,
			PhoneNumber:     user.PhoneNumber,
			PaymentProvider: entity.PaymentProviderBridge,
			ExpiresAt:       &expiresAt,
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		return tx.WithContext(ctx).Create(&order).Error
	})
	if err != nil {
		return model.OrderResponse{}, err
	}

	session, err := service.Gateway.CreatePayment(ctx, payment.CreatePaymentRequest{
		Source:      "telisik",
		OrderID:     order.OrderNumber,
		GrossAmount: amount,
		Customer: payment.Customer{
			Name:  user.Name,
			Email: user.Email,
			Phone: user.PhoneNumber,
		},
		Items: []payment.Item{{
			ID:       pkg.PackageID.String(),
			Name:     truncateName(pkg.Name+" - "+program.Name, 50),
			Price:    amount,
			Quantity: 1,
		}},
		CallbackURL:       service.Config.CallbackURL,
		FinishRedirectURL: strings.ReplaceAll(service.Config.FinishRedirectURL, "{order_number}", order.OrderNumber),
		ExpiryMinutes:     service.Config.ExpiryMinutes,
	})
	if err != nil {
		log.Printf("payment bridge failed for order %s: %v", order.OrderNumber, err)
		_ = service.OrderRepository.UpdateFields(ctx, order.OrderID, map[string]interface{}{"status": entity.OrderFailed})
		if errors.Is(err, payment.ErrNotConfigured) {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Pembayaran online belum tersedia. Silakan hubungi admin."}
		}
		return model.OrderResponse{}, errors.New("gagal membuat pembayaran, silakan coba lagi")
	}

	if err := service.OrderRepository.UpdateFields(ctx, order.OrderID, map[string]interface{}{
		"payment_token": session.Token,
		"payment_url":   session.RedirectURL,
	}); err != nil {
		return model.OrderResponse{}, err
	}

	order, err = service.OrderRepository.FindByID(ctx, order.OrderID)
	if err != nil {
		return model.OrderResponse{}, err
	}
	return toOrderResponse(order, false, now), nil
}

func truncateName(name string, max int) string {
	runes := []rune(name)
	if len(runes) <= max {
		return name
	}
	return string(runes[:max])
}

// ensureQuota locks the package row so two buyers cannot take the last seat.
func (service *OrderService) ensureQuota(ctx context.Context, tx *gorm.DB, pkg entity.Package, now time.Time) error {
	if pkg.Quota == nil {
		return nil
	}
	var locked entity.Package
	if err := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("package_id = ?", pkg.PackageID).First(&locked).Error; err != nil {
		return err
	}
	reserved, err := service.OrderRepository.CountReserved(ctx, tx, pkg.PackageID, now)
	if err != nil {
		return err
	}
	if int(reserved) >= *pkg.Quota {
		return exception.BadRequestError{Message: "Kuota paket " + pkg.Name + " sudah penuh."}
	}
	return nil
}

func (service *OrderService) claimFree(ctx context.Context, user entity.User, pkg entity.Package, now time.Time) (model.OrderResponse, error) {
	claimed, err := service.OrderRepository.HasPaidFreeOrderForPhone(ctx, pkg.PackageID, user.PhoneNumber)
	if err != nil {
		return model.OrderResponse{}, err
	}
	if claimed {
		return model.OrderResponse{}, exception.BadRequestError{Message: "Nomor WhatsApp ini sudah pernah memakai paket " + pkg.Name + "."}
	}

	var order entity.Order
	err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := service.ensureQuota(ctx, tx, pkg, now); err != nil {
			return err
		}
		order = entity.Order{
			OrderID:         uuid.New(),
			OrderNumber:     newOrderNumber(now),
			UserID:          user.UserID,
			PackageID:       pkg.PackageID,
			ProgramID:       pkg.ProgramID,
			Amount:          0,
			Status:          entity.OrderPaid,
			PhoneNumber:     user.PhoneNumber,
			PaymentProvider: entity.PaymentProviderFree,
			PaidAt:          &now,
			CreatedAt:       now,
			UpdatedAt:       now,
		}
		if err := tx.WithContext(ctx).Create(&order).Error; err != nil {
			return err
		}
		return service.TransactionProgramRepository.GrantPackage(ctx, tx, user.UserID, pkg.ProgramID, pkg.PackageID, helper.GenerateInvoiceNumber())
	})
	if err != nil {
		if strings.Contains(err.Error(), "orders_free_package_phone_unique") {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Nomor WhatsApp ini sudah pernah memakai paket " + pkg.Name + "."}
		}
		return model.OrderResponse{}, err
	}

	created, err := service.OrderRepository.FindByID(ctx, order.OrderID)
	if err != nil {
		return model.OrderResponse{}, err
	}
	return toOrderResponse(created, false, now), nil
}

// HandleCallback applies a status update forwarded by the Midtrans bridge.
// It is idempotent: a paid order stays paid and is granted only once.
func (service *OrderService) HandleCallback(ctx context.Context, timestamp string, signature string, body []byte) error {
	if err := payment.VerifyCallback(service.Config.CallbackSecret, timestamp, signature, body, service.Now()); err != nil {
		if errors.Is(err, payment.ErrNotConfigured) {
			log.Printf("payment callback rejected: PAYMENT_CALLBACK_SECRET is not set")
		}
		return exception.UnauthorizedError{Message: "invalid callback signature"}
	}

	var callback model.PaymentCallbackRequest
	if err := json.Unmarshal(body, &callback); err != nil || callback.OrderID == "" {
		return exception.BadRequestError{Message: "payload callback tidak valid"}
	}
	if !strings.HasPrefix(callback.OrderID, "TLS-") {
		// Orders of the other business are not ours; acknowledge and ignore.
		return nil
	}

	newStatus := payment.MapMidtransStatus(callback.TransactionStatus, callback.FraudStatus)
	if newStatus == "" {
		log.Printf("payment callback for %s ignored: status %q", callback.OrderID, callback.TransactionStatus)
		return nil
	}

	now := service.Now()
	return service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		order, err := service.OrderRepository.FindByNumberForUpdate(ctx, tx, callback.OrderID)
		if errors.Is(err, repository.ErrOrderNotFound) {
			return exception.NotFoundError{Message: "order Not Found"}
		}
		if err != nil {
			return err
		}

		changes := map[string]interface{}{
			"last_callback": string(body),
			"updated_at":    now,
		}
		if callback.PaymentType != "" {
			changes["payment_method"] = callback.PaymentType
		}
		if callback.TransactionID != "" {
			changes["provider_reference"] = callback.TransactionID
		}

		if order.Status == entity.OrderPaid {
			// Already granted; never move a paid order back.
			return tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", order.OrderID).
				Updates(map[string]interface{}{"last_callback": string(body), "updated_at": now}).Error
		}

		if newStatus == payment.StatusPaid {
			amount, err := payment.ParseAmount(string(callback.GrossAmount))
			if err != nil || amount != order.Amount {
				log.Printf("payment callback for %s has amount %q, expected %d", order.OrderNumber, callback.GrossAmount, order.Amount)
				return exception.BadRequestError{Message: "nominal pembayaran tidak sesuai"}
			}
			changes["status"] = entity.OrderPaid
			changes["paid_at"] = now
			if err := tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", order.OrderID).Updates(changes).Error; err != nil {
				return err
			}
			return service.TransactionProgramRepository.GrantPackage(ctx, tx, order.UserID, order.ProgramID, order.PackageID, helper.GenerateInvoiceNumber())
		}

		changes["status"] = newStatus
		return tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", order.OrderID).Updates(changes).Error
	})
}

// MarkPaid lets an admin confirm a payment by hand (for example when a
// callback was lost). It grants the package like a paid callback would.
func (service *OrderService) MarkPaid(ctx context.Context, orderID string, request model.MarkOrderPaidRequest) (model.OrderResponse, error) {
	if err := common.Validate(request); err != nil {
		return model.OrderResponse{}, err
	}
	id, err := parseID(orderID, "order_id")
	if err != nil {
		return model.OrderResponse{}, err
	}
	now := service.Now()

	err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var order entity.Order
		result := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).Where("order_id = ?", id).Limit(1).Find(&order)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return exception.NotFoundError{Message: "order Not Found"}
		}
		if order.Status == entity.OrderPaid {
			return exception.BadRequestError{Message: "order sudah lunas"}
		}
		method := strings.TrimSpace(request.PaymentMethod)
		if method == "" {
			method = "manual"
		}
		if err := tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", order.OrderID).Updates(map[string]interface{}{
			"status":             entity.OrderPaid,
			"paid_at":            now,
			"payment_method":     method,
			"provider_reference": strings.TrimSpace(request.Reference),
			"payment_provider":   entity.PaymentProviderManual,
			"updated_at":         now,
		}).Error; err != nil {
			return err
		}
		return service.TransactionProgramRepository.GrantPackage(ctx, tx, order.UserID, order.ProgramID, order.PackageID, helper.GenerateInvoiceNumber())
	})
	if err != nil {
		return model.OrderResponse{}, err
	}

	order, err := service.OrderRepository.FindByID(ctx, id)
	if err != nil {
		return model.OrderResponse{}, err
	}
	return toOrderResponse(order, true, now), nil
}

// FindForUser returns one order of the user by its number.
func (service *OrderService) FindForUser(ctx context.Context, userID string, orderNumber string, isAdmin bool) (model.OrderResponse, error) {
	order, err := service.OrderRepository.FindByNumber(ctx, orderNumber)
	if err != nil || (!isAdmin && order.UserID.String() != userID) {
		return model.OrderResponse{}, exception.NotFoundError{Message: "order Not Found"}
	}
	return toOrderResponse(order, isAdmin, service.Now()), nil
}

func (service *OrderService) ListForUser(ctx context.Context, userID string) ([]model.OrderResponse, error) {
	orders, _, err := service.OrderRepository.FindAll(ctx, repository.FindOrdersParams{UserID: userID, Limit: 100})
	if err != nil {
		return nil, err
	}
	now := service.Now()
	responses := make([]model.OrderResponse, 0, len(orders))
	for _, order := range orders {
		responses = append(responses, toOrderResponse(order, false, now))
	}
	return responses, nil
}

func (service *OrderService) ListAll(ctx context.Context, request model.FindAllOrdersRequest) ([]model.OrderResponse, int64, error) {
	if _, err := service.OrderRepository.ExpireStale(ctx, service.Now()); err != nil {
		log.Printf("failed to expire stale orders: %v", err)
	}
	orders, total, err := service.OrderRepository.FindAll(ctx, repository.FindOrdersParams{
		ProgramID: request.ProgramID,
		PackageID: request.PackageID,
		Status:    strings.ToUpper(request.Status),
		Search:    strings.TrimSpace(request.Search),
		Limit:     request.Limit,
		Offset:    request.Offset,
	})
	if err != nil {
		return nil, 0, err
	}
	now := service.Now()
	responses := make([]model.OrderResponse, 0, len(orders))
	for _, order := range orders {
		responses = append(responses, toOrderResponse(order, true, now))
	}
	return responses, total, nil
}
