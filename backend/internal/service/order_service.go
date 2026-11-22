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

// Referral rules from the business plan: the friend gets Rp10.000 off their
// first paid package, the referrer gets 1 extra tryout per paid friend.
const (
	ReferralDiscount     = 10000
	ReferralBonusTryouts = 1
)

// PaymentExpiryMinutes is how long a Midtrans payment link stays valid.
const PaymentExpiryMinutes = 24 * 60

// CheckoutLinks are the URLs the payment bridge needs for one checkout. They
// come from the request (our API host, the buyer's web origin) so no extra
// configuration is needed.
type CheckoutLinks struct {
	// CallbackURL is where the bridge pings us when the status changes.
	CallbackURL string
	// FinishURL is where Midtrans sends the buyer back; "{order_number}" is replaced.
	FinishURL string
}

type OrderService struct {
	OrderRepository              *repository.OrderRepository
	PackageRepository            *repository.PackageRepository
	ProgramRepository            *repository.ProgramRepository
	UserRepository               *repository.UserRepository
	TransactionProgramRepository *repository.TransactionProgramRepository
	AccessService                *AccessService
	Gateway                      payment.Gateway
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
) OrderService {
	return OrderService{
		OrderRepository:              orderRepository,
		PackageRepository:            packageRepository,
		ProgramRepository:            programRepository,
		UserRepository:               userRepository,
		TransactionProgramRepository: transactionProgramRepository,
		AccessService:                accessService,
		Gateway:                      gateway,
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
		ListPrice:         order.ListPrice,
		Discount:          order.Discount,
		ReferralCode:      order.ReferralCode,
		IsUpgrade:         order.UpgradeFromPackageID != nil,
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
func (service *OrderService) Checkout(ctx context.Context, userID string, request model.CreateOrderRequest, links CheckoutLinks) (model.OrderResponse, error) {
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
	var upgradeFrom *uuid.UUID
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
		fromID := membership.Package.PackageID
		upgradeFrom = &fromID
	}

	listPrice := pkg.CurrentPrice(now)
	if listPrice == 0 {
		return service.claimFree(ctx, user, pkg, now)
	}

	paid, err := service.OrderRepository.SumPaid(ctx, user.UserID, pkg.ProgramID)
	if err != nil {
		return model.OrderResponse{}, err
	}
	amount := listPrice
	if upgradeFrom != nil {
		amount = UpgradePrice(pkg, paid, now)
	}

	// Referral: only for a participant's first paid package in the program.
	discount := 0
	referralCode := strings.ToUpper(strings.TrimSpace(request.ReferralCode))
	var referrerID *uuid.UUID
	if referralCode != "" {
		if upgradeFrom != nil || paid.Total > 0 {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Kode rujukan hanya berlaku untuk pembelian paket berbayar pertama."}
		}
		referrer, err := service.UserRepository.FindByReferralCode(ctx, referralCode)
		if err != nil {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Kode rujukan tidak ditemukan."}
		}
		if referrer.UserID == user.UserID || (referrer.PhoneNumber != "" && referrer.PhoneNumber == user.PhoneNumber) {
			return model.OrderResponse{}, exception.BadRequestError{Message: "Kode rujukan tidak bisa dipakai untuk akun sendiri."}
		}
		referrerUserID := referrer.UserID
		referrerID = &referrerUserID
		discount = ReferralDiscount
		if discount > amount {
			discount = amount
		}
		amount -= discount
	}

	if amount == 0 {
		// Fully covered (e.g. an upgrade already paid for): grant at once.
		return service.grantWithoutPayment(ctx, user, pkg, now, entity.Order{
			ListPrice:            listPrice,
			Discount:             discount,
			ReferralCode:         referralCode,
			ReferrerUserID:       referrerID,
			UpgradeFromPackageID: upgradeFrom,
			PaymentProvider:      entity.PaymentProviderManual,
			PaymentMethod:        "upgrade",
		})
	}

	// Reuse an unpaid order so repeated clicks do not create duplicates.
	if open, ok := service.OrderRepository.FindOpenOrder(ctx, user.UserID, pkg.PackageID, now); ok && open.Amount == amount && open.ReferralCode == referralCode && (open.PaymentURL != "" || open.PaymentToken != "") {
		order, err := service.OrderRepository.FindByID(ctx, open.OrderID)
		if err != nil {
			return model.OrderResponse{}, err
		}
		return toOrderResponse(order, false, now), nil
	}

	expiresAt := now.Add(PaymentExpiryMinutes * time.Minute)
	var order entity.Order
	err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := service.ensureQuota(ctx, tx, pkg, now); err != nil {
			return err
		}
		order = entity.Order{
			OrderID:              uuid.New(),
			OrderNumber:          newOrderNumber(now),
			UserID:               user.UserID,
			PackageID:            pkg.PackageID,
			ProgramID:            pkg.ProgramID,
			Amount:               amount,
			ListPrice:            listPrice,
			Discount:             discount,
			ReferralCode:         referralCode,
			ReferrerUserID:       referrerID,
			UpgradeFromPackageID: upgradeFrom,
			Status:               entity.OrderPending,
			PhoneNumber:          user.PhoneNumber,
			PaymentProvider:      entity.PaymentProviderBridge,
			ExpiresAt:            &expiresAt,
			CreatedAt:            now,
			UpdatedAt:            now,
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
		CallbackURL:       links.CallbackURL,
		FinishRedirectURL: strings.ReplaceAll(links.FinishURL, "{order_number}", order.OrderNumber),
		ExpiryMinutes:     PaymentExpiryMinutes,
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
	return service.grantWithoutPayment(ctx, user, pkg, now, entity.Order{PaymentProvider: entity.PaymentProviderFree})
}

// grantWithoutPayment records a paid order of amount 0 and grants the package.
func (service *OrderService) grantWithoutPayment(ctx context.Context, user entity.User, pkg entity.Package, now time.Time, template entity.Order) (model.OrderResponse, error) {
	order := template
	order.OrderID = uuid.New()
	order.OrderNumber = newOrderNumber(now)
	order.UserID = user.UserID
	order.PackageID = pkg.PackageID
	order.ProgramID = pkg.ProgramID
	order.Amount = 0
	order.Status = entity.OrderPaid
	order.PhoneNumber = user.PhoneNumber
	order.PaidAt = &now
	order.CreatedAt = now
	order.UpdatedAt = now

	err := service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := service.ensureQuota(ctx, tx, pkg, now); err != nil {
			return err
		}
		if err := tx.WithContext(ctx).Create(&order).Error; err != nil {
			return err
		}
		return service.completePaid(ctx, tx, order)
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

// completePaid runs everything that follows a payment, inside tx: grant the
// package and reward the referrer (once per order).
func (service *OrderService) completePaid(ctx context.Context, tx *gorm.DB, order entity.Order) error {
	if err := service.TransactionProgramRepository.GrantPackage(ctx, tx, order.UserID, order.ProgramID, order.PackageID, helper.GenerateInvoiceNumber()); err != nil {
		return err
	}
	if order.ReferrerUserID == nil || order.Amount <= 0 {
		return nil
	}

	granted, err := service.TransactionProgramRepository.AddBonusTryouts(ctx, tx, *order.ReferrerUserID, order.ProgramID, ReferralBonusTryouts)
	if err != nil {
		return err
	}
	reward := entity.ReferralReward{
		OrderID:        order.OrderID,
		ReferrerUserID: *order.ReferrerUserID,
		ProgramID:      order.ProgramID,
		BonusTryouts:   ReferralBonusTryouts,
		CreatedAt:      time.Now(),
	}
	if !granted {
		reward.BonusTryouts = 0
		reward.Note = "pengajak belum terdaftar di program ini"
	}
	return tx.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&reward).Error
}

// HandleCallback handles a ping from the payment bridge. The ping only says
// which order changed; the status itself is always fetched from the bridge.
func (service *OrderService) HandleCallback(ctx context.Context, body []byte) error {
	var callback struct {
		OrderID string `json:"order_id"`
	}
	if err := json.Unmarshal(body, &callback); err != nil || strings.TrimSpace(callback.OrderID) == "" {
		return exception.BadRequestError{Message: "payload callback tidak valid"}
	}
	if !strings.HasPrefix(callback.OrderID, "TLS-") {
		// Not one of ours; acknowledge and ignore.
		return nil
	}
	_, err := service.SyncStatus(ctx, callback.OrderID)
	if errors.Is(err, repository.ErrOrderNotFound) {
		return nil
	}
	return err
}

// SyncStatus fetches the Midtrans status of an order from the bridge and
// applies it. It is idempotent: a paid order stays paid and the package is
// granted only once. It returns the order status after the sync.
func (service *OrderService) SyncStatus(ctx context.Context, orderNumber string) (string, error) {
	order, err := service.OrderRepository.FindByNumber(ctx, orderNumber)
	if err != nil {
		return "", err
	}
	if order.Status == entity.OrderPaid || order.PaymentProvider != entity.PaymentProviderBridge {
		return order.Status, nil
	}

	status, err := service.Gateway.GetStatus(ctx, orderNumber)
	if err != nil {
		return order.Status, err
	}
	newStatus := payment.MapMidtransStatus(status.TransactionStatus, status.FraudStatus)
	if newStatus == "" || (newStatus == order.Status && newStatus != payment.StatusPaid) {
		return order.Status, nil
	}

	raw, _ := json.Marshal(status)
	now := service.Now()
	result := order.Status
	err = service.OrderRepository.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		locked, err := service.OrderRepository.FindByNumberForUpdate(ctx, tx, orderNumber)
		if err != nil {
			return err
		}
		if locked.Status == entity.OrderPaid {
			result = entity.OrderPaid
			return nil
		}

		changes := map[string]interface{}{"last_callback": string(raw), "updated_at": now}
		if status.PaymentType != "" {
			changes["payment_method"] = status.PaymentType
		}
		if status.TransactionID != "" {
			changes["provider_reference"] = status.TransactionID
		}

		if newStatus == payment.StatusPaid {
			// Money received: grant even if the order already timed out here.
			amount, err := payment.ParseAmount(status.GrossAmount)
			if err != nil || amount != locked.Amount {
				log.Printf("payment status for %s has amount %q, expected %d", locked.OrderNumber, status.GrossAmount, locked.Amount)
				return exception.BadRequestError{Message: "nominal pembayaran tidak sesuai"}
			}
			changes["status"] = entity.OrderPaid
			changes["paid_at"] = now
			if err := tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", locked.OrderID).Updates(changes).Error; err != nil {
				return err
			}
			result = entity.OrderPaid
			return service.completePaid(ctx, tx, locked)
		}

		// Other statuses only replace a pending order.
		if locked.Status != entity.OrderPending {
			return nil
		}
		changes["status"] = newStatus
		result = newStatus
		return tx.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", locked.OrderID).Updates(changes).Error
	})
	return result, err
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
		return service.completePaid(ctx, tx, order)
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
// A pending order is synced with the bridge first, so the status page is
// right even if the bridge's ping never arrived.
func (service *OrderService) FindForUser(ctx context.Context, userID string, orderNumber string, isAdmin bool) (model.OrderResponse, error) {
	order, err := service.OrderRepository.FindByNumber(ctx, orderNumber)
	if err != nil || (!isAdmin && order.UserID.String() != userID) {
		return model.OrderResponse{}, exception.NotFoundError{Message: "order Not Found"}
	}
	if order.Status == entity.OrderPending && order.PaymentProvider == entity.PaymentProviderBridge {
		if _, err := service.SyncStatus(ctx, orderNumber); err != nil {
			log.Printf("sync order %s: %v", orderNumber, err)
		} else if refreshed, err := service.OrderRepository.FindByNumber(ctx, orderNumber); err == nil {
			order = refreshed
		}
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
