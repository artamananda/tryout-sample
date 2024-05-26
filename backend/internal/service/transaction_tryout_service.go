package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type TransactionTryoutService struct {
	TransactionTryoutRepository *repository.TransactionTryoutRepository
}

func NewTransactionTryoutService(transactionTryoutRepository *repository.TransactionTryoutRepository) TransactionTryoutService {
	return TransactionTryoutService{
		TransactionTryoutRepository: transactionTryoutRepository,
	}
}

func (service *TransactionTryoutService) Create(ctx context.Context, request model.CreateTransactionTryoutRequest) (model.TransactionTryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.ValidationError{Message: err.Error()}
	}
	transactionTryout := entity.TransactionTryout{
		TryoutID: request.TryoutID,
		UserID:   request.UserID,
		Status:   "UNPAID",
	}

	transactionTryout = service.TransactionTryoutRepository.Create(ctx, transactionTryout)

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) Update(ctx context.Context, request model.UpdateTransactionTryoutRequest, transactionTryoutID string) (model.TransactionTryoutResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.ValidationError{Message: err.Error()}
	}

	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	transactionTryout.TryoutID = request.TryoutID
	transactionTryout.UserID = request.UserID
	transactionTryout.Status = request.Status
	transactionTryout.StartTime = request.StartTime
	transactionTryout.EndTime = request.EndTime

	transactionTryout = service.TransactionTryoutRepository.Update(ctx, transactionTryout)

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) Delete(ctx context.Context, transactionTryoutID string) error {
	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return exception.NotFoundError{Message: err.Error()}
	}

	service.TransactionTryoutRepository.Delete(ctx, transactionTryout)

	return nil
}

func (service *TransactionTryoutService) FindByID(ctx context.Context, transactionTryoutID string) (model.TransactionTryoutResponse, error) {
	transactionTryout, err := service.TransactionTryoutRepository.FindById(ctx, transactionTryoutID)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) FindByTryoutIDAndUserID(ctx context.Context, tryoutId string, userId string) (model.TransactionTryoutResponse, error) {
	transactionTryout, err := service.TransactionTryoutRepository.FindByTryoutIdAndUserId(ctx, tryoutId, userId)
	if err != nil {
		return model.TransactionTryoutResponse{}, exception.NotFoundError{Message: err.Error()}
	}

	return model.TransactionTryoutResponse{
		TransactionTryoutID: transactionTryout.TransactionTryoutID,
		TryoutID:            transactionTryout.TryoutID,
		UserID:              transactionTryout.UserID,
		Status:              transactionTryout.Status,
		StartTime:           transactionTryout.StartTime,
		EndTime:             transactionTryout.EndTime,
	}, nil
}

func (service *TransactionTryoutService) FindAll(ctx context.Context) []model.TransactionTryoutResponse {
	transactionTryouts := service.TransactionTryoutRepository.FindAll(ctx)

	transactionTryoutResponse := []model.TransactionTryoutResponse{}
	for _, transactionTryout := range transactionTryouts {
		transactionTryoutResponse = append(transactionTryoutResponse,
			model.TransactionTryoutResponse{
				TransactionTryoutID: transactionTryout.TransactionTryoutID,
				TryoutID:            transactionTryout.TryoutID,
				UserID:              transactionTryout.UserID,
				Status:              transactionTryout.Status,
				StartTime:           transactionTryout.StartTime,
				EndTime:             transactionTryout.EndTime,
			},
		)
	}
	if len(transactionTryouts) == 0 {
		return []model.TransactionTryoutResponse{}
	}

	return transactionTryoutResponse
}
