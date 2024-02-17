package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type TryoutService struct {
	TryoutRepository *repository.TryoutRepository
}

func NewTryoutService(tryoutRepository *repository.TryoutRepository) TryoutService {
	return TryoutService{
		TryoutRepository: tryoutRepository,
	}
}

func (service *TryoutService) Create(ctx context.Context, request model.CreateTryoutRequest) (model.TryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TryoutResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	tryout := entity.Tryout{
		Title:     request.Title,
		Duration:  request.Duration,
		StartTime: request.StartTime,
		EndTime:   request.EndTime,
		Token:     helper.GenerateOTP(6),
	}

	tryout = service.TryoutRepository.Create(ctx, tryout)

	return model.TryoutResponse{
		TryoutID:  tryout.TryoutID,
		Title:     tryout.Title,
		Duration:  tryout.Duration,
		StartTime: tryout.StartTime,
		EndTime:   tryout.EndTime,
		Token:     helper.GenerateOTP(6),
	}, nil
}

func (service *TryoutService) Update(ctx context.Context, request model.UpdateTryoutRequest, tryoutID string) (model.TryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TryoutResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return model.TryoutResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	tryout.Title = request.Title
	tryout.Duration = request.Duration
	tryout.StartTime = request.StartTime
	tryout.EndTime = request.EndTime

	tryout = service.TryoutRepository.Update(ctx, tryout)

	return model.TryoutResponse{
		TryoutID:  tryout.TryoutID,
		Title:     tryout.Title,
		Duration:  tryout.Duration,
		StartTime: tryout.StartTime,
		EndTime:   tryout.EndTime,
		Token:     tryout.Token,
	}, nil
}

func (service *TryoutService) Delete(ctx context.Context, tryoutID string) error {
	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return exception.NotFoundError{
			Message: err.Error(),
		}
	}

	service.TryoutRepository.Delete(ctx, tryout)

	return nil
}

func (service *TryoutService) FindByID(ctx context.Context, tryoutID string) (model.TryoutResponse, error) {
	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return model.TryoutResponse{}, err
	}

	return model.TryoutResponse{
		TryoutID:  tryout.TryoutID,
		Title:     tryout.Title,
		Duration:  tryout.Duration,
		StartTime: tryout.StartTime,
		EndTime:   tryout.EndTime,
		Token:     tryout.Token,
	}, nil
}

func (service *TryoutService) FindAll(ctx context.Context) []model.TryoutResponse {
	tryouts := service.TryoutRepository.FindAll(ctx)

	tryoutResponses := []model.TryoutResponse{}
	for _, tryout := range tryouts {
		tryoutResponses = append(tryoutResponses,
			model.TryoutResponse{
				TryoutID:  tryout.TryoutID,
				Title:     tryout.Title,
				Duration:  tryout.Duration,
				StartTime: tryout.StartTime,
				EndTime:   tryout.EndTime,
				Token:     tryout.Token,
			},
		)
	}
	if len(tryouts) == 0 {
		return []model.TryoutResponse{}
	}
	return tryoutResponses
}
