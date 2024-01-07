package service

import (
	"context"
	"database/sql"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
)

type UserService struct {
	UserRepository repository.UserRepository
	DB             *sql.DB
	Validate       *validator.Validate
}

func (service *UserService) Create(ctx context.Context, request entity.RegisterRequest) entity.RegisterResponse {
	err := service.Validate.Struct(request)
	exception.PanicLogging(err)

	tx, err := service.DB.Begin()
	exception.PanicLogging(err)
	defer helper.CommitOrRollback(tx)

	user := model.UserModel{
		Username: request.Username,
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
		Role:     request.Role,
	}

	user = service.UserRepository.Create(ctx, tx, user)

	return entity.RegisterResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) Update(ctx context.Context, request entity.UpdateUserRequest) entity.UpdateUserResponse {
	err := service.Validate.Struct(request)
	exception.PanicLogging(err)

	tx, err := service.DB.Begin()
	exception.PanicLogging(err)
	defer helper.CommitOrRollback(tx)

	user, err := service.UserRepository.FindById(ctx, tx, request.UserId)

	if err != nil {
		panic(exception.NotFoundError{
			Message: "user not found",
		})
	}

	user.Username = request.Username
	user.Name = request.Name
	user.Email = request.Email
	user.Password = request.Password
	user.Role = request.Role

	user = service.UserRepository.Update(ctx, tx, user)

	return entity.UpdateUserResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) Delete(ctx context.Context, userId uuid.UUID) {
	tx, err := service.DB.Begin()
	exception.PanicLogging(err)
	defer helper.CommitOrRollback(tx)

	user, err := service.UserRepository.FindById(ctx, tx, userId)
	exception.PanicLogging(err)

	service.UserRepository.Delete(ctx, tx, user)
}

func (service *UserService) FindById(ctx context.Context, userId uuid.UUID) entity.GetUserResponse {
	tx, err := service.DB.Begin()
	exception.PanicLogging(err)
	defer helper.CommitOrRollback(tx)

	user, err := service.UserRepository.FindById(ctx, tx, userId)
	exception.PanicLogging(err)

	return entity.GetUserResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) FindAll(ctx context.Context) []entity.GetUserResponse {
	tx, err := service.DB.Begin()
	exception.PanicLogging(err)
	defer helper.CommitOrRollback(tx)

	users := service.UserRepository.FindAll(ctx, tx)

	userResponses := []entity.GetUserResponse{}
	for _, user := range users {
		userResponses = append(userResponses,
			entity.GetUserResponse{
				UserId:   user.UserId,
				Username: user.Username,
				Name:     user.Name,
				Email:    user.Email,
				Role:     user.Role,
			},
		)
	}
	return userResponses
}
