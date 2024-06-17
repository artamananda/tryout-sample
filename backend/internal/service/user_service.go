package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
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

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)

	user := entity.User{
		Username: request.Username,
		Name:     request.Name,
		Email:    request.Email,
		Password: string(hashedPassword),
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

func (service *UserService) CreateBulk(ctx context.Context, requests []model.RegisterRequest) ([]model.RegisterResponse, error) {
	var responses []model.RegisterResponse

	for _, request := range requests {
		err := common.Validate(request)
		if err != nil {
			return responses, err
		}
	}

	for _, request := range requests {
		response, err := service.Create(ctx, request)
		if err != nil {
			responses = append(responses, model.RegisterResponse{})
			continue
		}
		responses = append(responses, response)
	}

	return responses, nil
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

func (service *UserService) Authentication(ctx context.Context, model model.LoginRequest) (entity.User, error) {
	userResult, err := service.UserRepository.Authentication(ctx, model.Email)
	if err != nil {
		fmt.Println(exception.UnauthorizedError{
			Message: err.Error(),
		})
		return entity.User{}, err
	}
	err = bcrypt.CompareHashAndPassword([]byte(userResult.Password), []byte(model.Password))
	if err != nil {
		fmt.Println(exception.UnauthorizedError{
			Message: "incorrect username and password",
		})
		return entity.User{}, err
	}
	return userResult, nil
}

func (service *UserService) SendOtp(ctx context.Context, otpConfig model.SendOtpConfig, request model.CreateUserOtpRequest) (model.UserOtpResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.UserOtpResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	otp := helper.GenerateOTP(6)

	userOtp := entity.UserOtp{
		Email:     request.Email,
		Otp:       otp,
		ExpiredAt: time.Now().Add(15 * time.Minute),
		CreatedAt: time.Now(),
	}

	userOtp = service.UserRepository.CreateOtp(ctx, userOtp)

	mailer := gomail.NewMessage()
	mailer.SetHeader("From", otpConfig.SenderName)
	mailer.SetHeader("To", request.Email)
	mailer.SetHeader("Subject", "Test otp mail")
	mailer.SetBody("text/html", helper.TemplateEmailOtp(request.Name, otp))

	smptPort, _ := strconv.Atoi(otpConfig.SmtpPort)

	dialer := gomail.NewDialer(
		otpConfig.SmtpHost,
		smptPort,
		otpConfig.AuthEmail,
		otpConfig.AuthPassword,
	)

	err = dialer.DialAndSend(mailer)
	if err != nil {
		log.Fatal(err.Error())
	}

	log.Println("Mail sent!")

	return model.UserOtpResponse{
		Email:     userOtp.Email,
		ExpiredAt: userOtp.ExpiredAt,
		CreatedAt: userOtp.CreatedAt,
	}, nil
}

func (service *UserService) CheckOtp(ctx context.Context, email string, otpReq string) bool {
	userOtp, err := service.UserRepository.FindOtpByEmail(ctx, email)
	if err != nil {
		return false
	}

	if userOtp.Otp != otpReq {
		return false
	}

	if userOtp.ExpiredAt.Before(time.Now()) {
		return false
	}

	return true
}

func (service *UserService) SelfRegister(ctx context.Context, request model.SelfRegisterRequest) (model.RegisterResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	userOtp, err := service.UserRepository.FindOtpByEmail(ctx, request.Email)
	if err != nil {
		return model.RegisterResponse{}, err
	}

	if userOtp.Otp != request.Otp {
		return model.RegisterResponse{}, errors.New("otp is not valid")
	}

	if userOtp.ExpiredAt.Before(time.Now()) {
		return model.RegisterResponse{}, errors.New("otp is expired")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)

	user := entity.User{
		Username: request.Username,
		Name:     request.Name,
		Email:    request.Email,
		Password: string(hashedPassword),
		Role:     "user",
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
