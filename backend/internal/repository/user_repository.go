package repository

import (
	"context"
	"errors"
	"strings"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ErrAccountAlreadyExists is returned by Create when the email or username is taken.
var ErrAccountAlreadyExists = errors.New("account is already exist")

type UserRepository struct {
	*gorm.DB
}

func NewUserRepository(DB *gorm.DB) UserRepository {
	return UserRepository{DB: DB}
}

func (repository *UserRepository) Create(ctx context.Context, user entity.User) (entity.User, error) {
	if repository.FindAccountIsExist(ctx, user.Email, user.Username) {
		return entity.User{}, ErrAccountAlreadyExists
	}
	user.UserID = uuid.New()
	if err := repository.DB.WithContext(ctx).Create(&user).Error; err != nil {
		return entity.User{}, err
	}
	return user, nil
}

// Update writes the non-zero fields of user. Use UpdateFields when a field
// must be cleared.
func (repository *UserRepository) Update(ctx context.Context, user entity.User) (entity.User, error) {
	err := repository.DB.WithContext(ctx).Where("user_id = ?", user.UserID).Updates(&user).Error
	return user, err
}

// UpdateFields writes exactly the given columns, including empty values.
func (repository *UserRepository) UpdateFields(ctx context.Context, userID uuid.UUID, fields map[string]interface{}) error {
	if len(fields) == 0 {
		return nil
	}
	return repository.DB.WithContext(ctx).
		Model(&entity.User{}).
		Where("user_id = ?", userID).
		Updates(fields).Error
}

func (repository *UserRepository) Delete(ctx context.Context, user entity.User) error {
	return repository.DB.WithContext(ctx).Where("user_id = ?", user.UserID).Delete(&user).Error
}

func (repository *UserRepository) FindById(ctx context.Context, userId string) (entity.User, error) {
	if _, err := uuid.Parse(userId); err != nil {
		return entity.User{}, errors.New("user Not Found")
	}
	var user entity.User
	result := repository.DB.WithContext(ctx).Where("user_id = ?", userId).First(&user)
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("user Not Found")
	}
	return user, nil
}

func (repository *UserRepository) FindAll(ctx context.Context, params model.FindAllUserRequest) []entity.User {
	var users []entity.User
	query := repository.DB.WithContext(ctx)

	if params.Search != "" {
		query = query.Where("name ILIKE ?", "%"+params.Search+"%")
	}

	if params.Role != "" {
		query = query.Where("role = ?", params.Role)
	}
	if params.Verified != nil {
		if *params.Verified {
			query = query.Where("verified_at IS NOT NULL")
		} else {
			query = query.Where("verified_at IS NULL")
		}
	}
	query = query.Order("created_at DESC")
	query.Find(&users)
	return users
}

func (repository *UserRepository) Authentication(ctx context.Context, email string) (entity.User, error) {
	var userResult entity.User
	result := repository.DB.WithContext(ctx).Where("LOWER(email) = ?", normalizeEmail(email)).First(&userResult)
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("user not found")
	}
	return userResult, nil
}

func (repository *UserRepository) CreateOtp(ctx context.Context, user_otp entity.UserOtp) (entity.UserOtp, error) {
	query := `INSERT INTO user_otp (email, otp, expired_at, created_at)
	VALUES ($1, $2, $3, $4)
	ON CONFLICT (email) DO UPDATE SET
    otp = $2,
	expired_at = $3,
    created_at = $4;`
	err := repository.DB.WithContext(ctx).Exec(query, user_otp.Email, user_otp.Otp, user_otp.ExpiredAt, user_otp.CreatedAt).Error
	return user_otp, err
}

func (repository *UserRepository) FindOtpByEmail(ctx context.Context, email string) (entity.UserOtp, error) {
	var otp entity.UserOtp
	result := repository.DB.WithContext(ctx).Where("email = ?", email).First(&otp)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return entity.UserOtp{}, errors.New("otp not found")
		}
		return entity.UserOtp{}, result.Error
	}

	return otp, nil
}

// DeleteOtp removes the OTP for email so it cannot be reused.
func (repository *UserRepository) DeleteOtp(ctx context.Context, email string) error {
	return repository.DB.WithContext(ctx).Where("email = ?", email).Delete(&entity.UserOtp{}).Error
}

// FindAccountIsExist reports whether the email or (when non-empty) the username
// is already registered.
func (repository *UserRepository) FindAccountIsExist(ctx context.Context, email string, username string) bool {
	var count int64
	query := repository.DB.WithContext(ctx).Model(&entity.User{})
	if strings.TrimSpace(username) != "" {
		query = query.Where("LOWER(email) = ? OR LOWER(username) = ?", normalizeEmail(email), strings.ToLower(strings.TrimSpace(username)))
	} else {
		query = query.Where("LOWER(email) = ?", normalizeEmail(email))
	}
	query.Count(&count)

	return count > 0
}

// IsUsernameTaken reports whether another user already uses username.
func (repository *UserRepository) IsUsernameTaken(ctx context.Context, username string, excludeUserID uuid.UUID) bool {
	var count int64
	repository.DB.WithContext(ctx).Model(&entity.User{}).
		Where("LOWER(username) = ? AND user_id <> ?", strings.ToLower(strings.TrimSpace(username)), excludeUserID).
		Count(&count)
	return count > 0
}

// IsEmailTaken reports whether another user already uses email.
func (repository *UserRepository) IsEmailTaken(ctx context.Context, email string, excludeUserID uuid.UUID) bool {
	var count int64
	repository.DB.WithContext(ctx).Model(&entity.User{}).
		Where("LOWER(email) = ? AND user_id <> ?", normalizeEmail(email), excludeUserID).
		Count(&count)
	return count > 0
}

// IsPhoneNumberTaken reports whether another user already uses phoneNumber.
func (repository *UserRepository) IsPhoneNumberTaken(ctx context.Context, phoneNumber string, excludeUserID uuid.UUID) bool {
	var count int64
	repository.DB.WithContext(ctx).Model(&entity.User{}).
		Where("phone_number = ? AND user_id <> ?", phoneNumber, excludeUserID).
		Count(&count)
	return count > 0
}

func (repository *UserRepository) FindByEmail(ctx context.Context, email string) (entity.User, error) {
	var user entity.User
	result := repository.DB.WithContext(ctx).Where("LOWER(email) = ?", normalizeEmail(email)).First(&user)
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("user Not Found")
	}
	return user, nil
}

func (repository *UserRepository) FindByIDs(ctx context.Context, userIDs []uuid.UUID) ([]entity.User, error) {
	if len(userIDs) == 0 {
		return []entity.User{}, nil
	}

	var users []entity.User
	err := repository.DB.WithContext(ctx).Where("user_id IN ?", userIDs).Find(&users).Error
	if err != nil {
		return nil, err
	}

	return users, nil
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

func (repository *UserRepository) FindByReferralCode(ctx context.Context, code string) (entity.User, error) {
	var user entity.User
	result := repository.DB.WithContext(ctx).Where("referral_code = ?", strings.ToUpper(strings.TrimSpace(code))).Limit(1).Find(&user)
	if result.Error != nil {
		return entity.User{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("referral code not found")
	}
	return user, nil
}

// SetReferralCodeIfEmpty stores code unless the user already has one, and
// returns the code the user ends up with.
func (repository *UserRepository) SetReferralCodeIfEmpty(ctx context.Context, userID uuid.UUID, code string) (string, error) {
	err := repository.DB.WithContext(ctx).Model(&entity.User{}).
		Where("user_id = ? AND referral_code IS NULL", userID).
		Update("referral_code", code).Error
	if err != nil {
		return "", err
	}
	var user entity.User
	if err := repository.DB.WithContext(ctx).Select("referral_code").Where("user_id = ?", userID).First(&user).Error; err != nil {
		return "", err
	}
	if user.ReferralCode == nil {
		return "", errors.New("referral code was not saved")
	}
	return *user.ReferralCode, nil
}

// PackageBadges returns, per user, the most expensive paid package they hold
// in any program. Users with only free packages are left out.
func (repository *UserRepository) PackageBadges(ctx context.Context, userIDs []uuid.UUID) (map[uuid.UUID]model.PackageBadge, error) {
	badges := map[uuid.UUID]model.PackageBadge{}
	if len(userIDs) == 0 {
		return badges, nil
	}
	var rows []struct {
		UserID uuid.UUID
		Code   string
		Name   string
	}
	err := repository.DB.WithContext(ctx).Raw(`
		SELECT DISTINCT ON (tp.user_id) tp.user_id, p.code, p.name
		FROM transaction_programs tp
		JOIN packages p ON p.package_id = tp.package_id
		WHERE tp.user_id IN ? AND tp.status = 'PAID' AND p.price > 0
		ORDER BY tp.user_id, p.price DESC, p.sort_order DESC`, userIDs).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, row := range rows {
		badges[row.UserID] = model.PackageBadge{Code: row.Code, Name: row.Name}
	}
	return badges, nil
}
