package repository

import (
	"context"
	"errors"

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

func (repository *UserRepository) FindAll(ctx context.Context) []entity.User {
	var users []entity.User
	repository.DB.WithContext(ctx).Find(&users)
	return users
}
