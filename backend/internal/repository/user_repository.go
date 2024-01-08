package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository struct {
	*gorm.DB
}

func NewUserRepository(DB *gorm.DB) UserRepository {
	return UserRepository{DB: DB}
}

func (repository *UserRepository) Create(ctx context.Context, user model.UserModel) model.UserModel {
	user.UserId = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&user).Error
	exception.PanicLogging(err)
	return user
}

func (repository *UserRepository) Update(ctx context.Context, user model.UserModel) model.UserModel {
	err := repository.DB.WithContext(ctx).Where("user_id = ?", user.UserId).Updates(&user).Error
	exception.PanicLogging(err)

	return user
}

func (repository *UserRepository) Delete(ctx context.Context, user model.UserModel) {
	err := repository.DB.WithContext(ctx).Where("user_id = ?", user.UserId).Delete(&user).Error
	exception.PanicLogging(err)
}

func (repository *UserRepository) FindById(ctx context.Context, userId string) (model.UserModel, error) {
	var user model.UserModel
	result := repository.DB.WithContext(ctx).Unscoped().Where("user_id = ?", userId).First(&user)
	if result.RowsAffected == 0 {
		return model.UserModel{}, errors.New("user Not Found")
	}
	return user, nil
}

func (repository *UserRepository) FindAll(ctx context.Context) []model.UserModel {
	var users []model.UserModel
	repository.DB.WithContext(ctx).Find(&users)
	return users
}
