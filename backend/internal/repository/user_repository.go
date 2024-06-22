package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	*gorm.DB
}

func NewUserRepository(DB *gorm.DB) UserRepository {
	return UserRepository{DB: DB}
}

func (repository *UserRepository) Create(ctx context.Context, user entity.User) entity.User {
	accountIsExist := repository.FindAccountIsExist(ctx, user.Email, user.Email)
	if accountIsExist {
		return entity.User{}
	}
	user.UserID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&user).Error
	exception.PanicLogging(err)
	return user
}

func (repository *UserRepository) Update(ctx context.Context, user entity.User) entity.User {
	err := repository.DB.WithContext(ctx).Where("user_id = ?", user.UserID).Updates(&user).Error
	exception.PanicLogging(err)

	return user
}

func (repository *UserRepository) Delete(ctx context.Context, user entity.User) {
	err := repository.DB.WithContext(ctx).Where("user_id = ?", user.UserID).Delete(&user).Error
	exception.PanicLogging(err)
}

func (repository *UserRepository) FindById(ctx context.Context, userId string) (entity.User, error) {
	var user entity.User
	result := repository.DB.WithContext(ctx).Unscoped().Where("user_id = ?", userId).First(&user)
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("user Not Found")
	}
	return user, nil
}

func (repository *UserRepository) FindAll(ctx context.Context, role string) []entity.User {
	var users []entity.User
	query := repository.DB.WithContext(ctx)
	if role != "" {
		query = query.Where("role = ?", role)
	}
	query = query.Order("created_at DESC")
	query.Find(&users)
	return users
}

func (repository *UserRepository) Authentication(ctx context.Context, email string) (entity.User, error) {
	var userResult entity.User
	result := repository.DB.WithContext(ctx).Unscoped().Where("email = ?", email).First(&userResult)
	if result.RowsAffected == 0 {
		return entity.User{}, errors.New("user not found")
	}
	return userResult, nil
}

func (repository *UserRepository) CreateOtp(ctx context.Context, user_otp entity.UserOtp) entity.UserOtp {
	query := `INSERT INTO user_otp (email, otp, expired_at, created_at)
	VALUES ($1, $2, $3, $4)
	ON CONFLICT (email) DO UPDATE SET
    otp = $2,
	expired_at = $3,
    created_at = $4;`
	err := repository.DB.WithContext(ctx).Exec(query, user_otp.Email, user_otp.Otp, user_otp.ExpiredAt, user_otp.CreatedAt)
	if err != nil {
		fmt.Println(err)
	}
	return user_otp
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

func (repository *UserRepository) FindAccountIsExist(ctx context.Context, email string, username string) bool {
	var count int64
	repository.DB.WithContext(ctx).Model(&entity.User{}).
		Unscoped().
		Where("email = ?", email).
		Or("username = ?", username).
		Count(&count)

	return count > 0
}
