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

func (service *UserService) Create(ctx context.Context, request entity.RegisterRequest) entity.RegisterResponse {
	common.Validate(request)
	user := model.UserModel{
		Username: request.Username,
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
		Role:     request.Role,
	}

	user = service.UserRepository.Create(ctx, user)

	return entity.RegisterResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) Update(ctx context.Context, request entity.UpdateUserRequest, userId string) entity.UpdateUserResponse {
	common.Validate(request)

	user, err := service.UserRepository.FindById(ctx, userId)

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

	user = service.UserRepository.Update(ctx, user)

	return entity.UpdateUserResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) Delete(ctx context.Context, userId string) {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		panic(exception.NotFoundError{
			Message: err.Error(),
		})
	}

	service.UserRepository.Delete(ctx, user)
}

func (service *UserService) FindById(ctx context.Context, userId string) entity.GetUserResponse {
	user, err := service.UserRepository.FindById(ctx, userId)
	if err != nil {
		panic(exception.NotFoundError{
			Message: err.Error(),
		})
	}

	return entity.GetUserResponse{
		UserId:   user.UserId,
		Username: user.Username,
		Name:     user.Name,
		Email:    user.Email,
		Role:     user.Role,
	}
}

func (service *UserService) FindAll(ctx context.Context) []entity.GetUserResponse {
	users := service.UserRepository.FindAll(ctx)

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
	if len(users) == 0 {
		return []entity.GetUserResponse{}
	}
	return userResponses
}
