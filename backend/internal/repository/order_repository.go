package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrOrderNotFound = errors.New("order Not Found")

type OrderRepository struct {
	*gorm.DB
}

func NewOrderRepository(DB *gorm.DB) OrderRepository {
	return OrderRepository{DB: DB}
}

type FindOrdersParams struct {
	UserID    string
	ProgramID string
	PackageID string
	Status    string
	Search    string
	Limit     int
	Offset    int
}

func (repository *OrderRepository) Create(ctx context.Context, order entity.Order) (entity.Order, error) {
	if order.OrderID == uuid.Nil {
		order.OrderID = uuid.New()
	}
	err := repository.DB.WithContext(ctx).Create(&order).Error
	return order, err
}

func (repository *OrderRepository) UpdateFields(ctx context.Context, orderID uuid.UUID, fields map[string]interface{}) error {
	fields["updated_at"] = time.Now()
	return repository.DB.WithContext(ctx).Model(&entity.Order{}).Where("order_id = ?", orderID).Updates(fields).Error
}

func (repository *OrderRepository) FindByID(ctx context.Context, orderID uuid.UUID) (entity.Order, error) {
	return repository.findOne(ctx, repository.DB.WithContext(ctx).Where("orders.order_id = ?", orderID))
}

func (repository *OrderRepository) FindByNumber(ctx context.Context, orderNumber string) (entity.Order, error) {
	return repository.findOne(ctx, repository.DB.WithContext(ctx).Where("orders.order_number = ?", orderNumber))
}

// FindByNumberForUpdate locks the order row inside tx so concurrent callbacks
// for the same order are applied one after another.
func (repository *OrderRepository) FindByNumberForUpdate(ctx context.Context, tx *gorm.DB, orderNumber string) (entity.Order, error) {
	var order entity.Order
	result := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("order_number = ?", orderNumber).Limit(1).Find(&order)
	if result.Error != nil {
		return entity.Order{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.Order{}, ErrOrderNotFound
	}
	return order, nil
}

func (repository *OrderRepository) findOne(ctx context.Context, query *gorm.DB) (entity.Order, error) {
	var order entity.Order
	result := query.Preload("Package").Preload("User").Limit(1).Find(&order)
	if result.Error != nil {
		return entity.Order{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.Order{}, ErrOrderNotFound
	}
	return order, nil
}

func (repository *OrderRepository) FindAll(ctx context.Context, params FindOrdersParams) ([]entity.Order, int64, error) {
	query := repository.DB.WithContext(ctx).Model(&entity.Order{})
	if params.UserID != "" {
		query = query.Where("orders.user_id = ?", params.UserID)
	}
	if params.ProgramID != "" {
		query = query.Where("orders.program_id = ?", params.ProgramID)
	}
	if params.PackageID != "" {
		query = query.Where("orders.package_id = ?", params.PackageID)
	}
	if params.Status != "" {
		query = query.Where("orders.status = ?", params.Status)
	}
	if params.Search != "" {
		like := "%" + params.Search + "%"
		query = query.Joins("JOIN users ON users.user_id = orders.user_id").
			Where("orders.order_number ILIKE ? OR users.name ILIKE ? OR users.email ILIKE ? OR orders.phone_number ILIKE ?", like, like, like, like)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if params.Limit <= 0 || params.Limit > 200 {
		params.Limit = 50
	}
	var orders []entity.Order
	err := query.Preload("Package").Preload("User").
		Order("orders.created_at DESC").
		Limit(params.Limit).Offset(params.Offset).
		Find(&orders).Error
	return orders, total, err
}

// CountReserved counts paid orders plus pending ones that have not expired,
// so a quota cannot be oversold while payments are in progress.
func (repository *OrderRepository) CountReserved(ctx context.Context, tx *gorm.DB, packageID uuid.UUID, now time.Time) (int64, error) {
	var count int64
	err := tx.WithContext(ctx).Model(&entity.Order{}).
		Where("package_id = ? AND (status = ? OR (status = ? AND (expires_at IS NULL OR expires_at > ?)))",
			packageID, entity.OrderPaid, entity.OrderPending, now).
		Count(&count).Error
	return count, err
}

// HasPaidFreeOrderForPhone reports whether a free package was already claimed with phone.
func (repository *OrderRepository) HasPaidFreeOrderForPhone(ctx context.Context, packageID uuid.UUID, phone string) (bool, error) {
	var count int64
	err := repository.DB.WithContext(ctx).Model(&entity.Order{}).
		Where("package_id = ? AND phone_number = ? AND amount = 0 AND status = ?", packageID, phone, entity.OrderPaid).
		Count(&count).Error
	return count > 0, err
}

// FindOpenOrder returns a pending, unexpired order of the user for the package.
func (repository *OrderRepository) FindOpenOrder(ctx context.Context, userID uuid.UUID, packageID uuid.UUID, now time.Time) (entity.Order, bool) {
	var order entity.Order
	result := repository.DB.WithContext(ctx).
		Where("user_id = ? AND package_id = ? AND status = ? AND (expires_at IS NULL OR expires_at > ?)", userID, packageID, entity.OrderPending, now).
		Order("created_at DESC").Limit(1).Find(&order)
	return order, result.Error == nil && result.RowsAffected > 0
}

// ExpireStale marks pending orders whose payment window passed as expired.
func (repository *OrderRepository) ExpireStale(ctx context.Context, now time.Time) (int64, error) {
	result := repository.DB.WithContext(ctx).Model(&entity.Order{}).
		Where("status = ? AND expires_at IS NOT NULL AND expires_at <= ?", entity.OrderPending, now).
		Updates(map[string]interface{}{"status": entity.OrderExpired, "updated_at": now})
	return result.RowsAffected, result.Error
}

// PaidSummary is what a user has paid in one program.
type PaidSummary struct {
	Total      int
	LastPaidAt *time.Time
}

// SumPaid adds up the user's paid orders in a program and returns the time
// of the latest one.
func (repository *OrderRepository) SumPaid(ctx context.Context, userID uuid.UUID, programID uuid.UUID) (PaidSummary, error) {
	var row struct {
		Total      int
		LastPaidAt *time.Time
	}
	err := repository.DB.WithContext(ctx).Model(&entity.Order{}).
		Select("COALESCE(SUM(amount), 0) AS total, MAX(paid_at) AS last_paid_at").
		Where("user_id = ? AND program_id = ? AND status = ?", userID, programID, entity.OrderPaid).
		Scan(&row).Error
	return PaidSummary{Total: row.Total, LastPaidAt: row.LastPaidAt}, err
}

// FindPaidByProgram lists the paid orders of a program (for fee reports).
func (repository *OrderRepository) FindPaidByProgram(ctx context.Context, programID uuid.UUID) ([]entity.Order, error) {
	var orders []entity.Order
	err := repository.DB.WithContext(ctx).
		Where("program_id = ? AND status = ?", programID, entity.OrderPaid).
		Preload("Package").
		Find(&orders).Error
	return orders, err
}

// CountPaidReferrals counts paid orders that used the referrer's code.
func (repository *OrderRepository) CountPaidReferrals(ctx context.Context, referrerID uuid.UUID) (int64, error) {
	var count int64
	err := repository.DB.WithContext(ctx).Model(&entity.Order{}).
		Where("referrer_user_id = ? AND status = ? AND amount > 0", referrerID, entity.OrderPaid).
		Count(&count).Error
	return count, err
}
