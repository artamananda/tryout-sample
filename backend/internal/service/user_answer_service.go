package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type UserAnswerService struct {
	UserAnswerRepository *repository.UserAnswerRepository
}

func NewUserAnswerService(userAnswerRepository *repository.UserAnswerRepository) UserAnswerService {
	return UserAnswerService{
		UserAnswerRepository: userAnswerRepository,
	}
}

func (service *UserAnswerService) Create(ctx context.Context, request model.CreateUserAnswerRequest) (model.UserAnswerResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.UserAnswerResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	userAnswer := entity.UserAnswer{
		UserID:     request.UserID,
		TryoutID:   request.TryoutID,
		QuestionID: request.QuestionID,
		UserAnswer: request.UserAnswer,
	}

	userAnswer = service.UserAnswerRepository.Create(ctx, userAnswer)

	return model.UserAnswerResponse{
		UserAnswerID: userAnswer.UserAnswerID,
		UserID:       userAnswer.UserID,
		TryoutID:     userAnswer.TryoutID,
		QuestionID:   userAnswer.QuestionID,
		UserAnswer:   userAnswer.UserAnswer,
	}, nil
}

func (service *UserAnswerService) Update(ctx context.Context, request model.UpdateUserAnswerRequest, userAnswerID string) (model.UserAnswerResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.UserAnswerResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	userAnswer, err := service.UserAnswerRepository.FindById(ctx, userAnswerID)
	if err != nil {
		return model.UserAnswerResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	userAnswer.UserID = request.UserID
	userAnswer.TryoutID = request.TryoutID
	userAnswer.QuestionID = request.QuestionID
	userAnswer.UserAnswer = request.UserAnswer

	userAnswer = service.UserAnswerRepository.Update(ctx, userAnswer)

	return model.UserAnswerResponse{
		UserAnswerID: userAnswer.UserAnswerID,
		UserID:       userAnswer.UserID,
		TryoutID:     userAnswer.TryoutID,
		QuestionID:   userAnswer.QuestionID,
		UserAnswer:   userAnswer.UserAnswer,
	}, nil
}

func (service *UserAnswerService) Delete(ctx context.Context, userAnswerID string) error {
	userAnswer, err := service.UserAnswerRepository.FindById(ctx, userAnswerID)
	if err != nil {
		return exception.NotFoundError{
			Message: err.Error(),
		}
	}

	service.UserAnswerRepository.Delete(ctx, userAnswer)

	return nil
}

func (service *UserAnswerService) FindByID(ctx context.Context, userAnswerID string) (model.UserAnswerResponse, error) {
	userAnswer, err := service.UserAnswerRepository.FindById(ctx, userAnswerID)
	if err != nil {
		return model.UserAnswerResponse{}, err
	}

	return model.UserAnswerResponse{
		UserAnswerID: userAnswer.UserAnswerID,
		UserID:       userAnswer.UserID,
		TryoutID:     userAnswer.TryoutID,
		QuestionID:   userAnswer.QuestionID,
		UserAnswer:   userAnswer.UserAnswer,
	}, nil
}

func (service *UserAnswerService) FindAll(ctx context.Context) []model.UserAnswerResponse {
	userAnswers := service.UserAnswerRepository.FindAll(ctx)

	userAnswerResponses := []model.UserAnswerResponse{}
	for _, userAnswer := range userAnswers {
		userAnswerResponses = append(userAnswerResponses,
			model.UserAnswerResponse{
				UserAnswerID: userAnswer.UserAnswerID,
				UserID:       userAnswer.UserID,
				TryoutID:     userAnswer.TryoutID,
				QuestionID:   userAnswer.QuestionID,
				UserAnswer:   userAnswer.UserAnswer,
			},
		)
	}
	if len(userAnswers) == 0 {
		return []model.UserAnswerResponse{}
	}
	return userAnswerResponses
}
