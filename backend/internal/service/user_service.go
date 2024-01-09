package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type UserService struct {
	UserRepository *repository.UserRepository
}

func NewUserService(userRepository *repository.UserRepository) UserService {
	return UserService{
		UserRepository: userRepository,
	}
}

func (service *UserService) Create(ctx context.Context, request model.RegisterRequest) (model.RegisterResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	user := entity.User{
		Username: request.Username,
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
		Role:     request.Role,
	}

	user = service.UserRepository.Create(ctx, user)

	return model.RegisterResponse{
		UserID:   user.UserID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

func (service *UserService) Update(ctx context.Context, request model.UpdateUserRequest, userId string) (model.UpdateUserResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.UpdateUserResponse{}, err
	}

	user, err := service.UserRepository.FindById(ctx, userId)

	if err != nil {
		return model.UpdateUserResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	user.Username = request.Username
	user.Name = request.Name
	user.Email = request.Email
	user.Password = request.Password
	user.Role = request.Role

	user = service.UserRepository.Update(ctx, user)

	return model.UpdateUserResponse{
		UserID:   user.UserID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

func (service *UserService) Delete(ctx context.Context, userId string) error {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return exception.NotFoundError{
			Message: err.Error(),
		}
	}

	service.UserRepository.Delete(ctx, user)

	return nil
}

func (service *UserService) FindById(ctx context.Context, userId string) (model.GetUserResponse, error) {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		return model.GetUserResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.GetUserResponse{
		UserID:   user.UserID,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}, nil
}

func (service *UserService) FindAll(ctx context.Context) []model.GetUserResponse {
	users := service.UserRepository.FindAll(ctx)

	userResponses := []model.GetUserResponse{}
	for _, user := range users {
		userResponses = append(userResponses,
			model.GetUserResponse{
				UserID:   user.UserID,
				Username: user.Username,
				Name:     user.Name,
				Email:    user.Email,
				Role:     user.Role,
			},
		)
	}
	if len(users) == 0 {
		return []model.GetUserResponse{}
	}
	return userResponses
}
