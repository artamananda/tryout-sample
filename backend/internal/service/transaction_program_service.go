package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type TransactionProgramService struct {
	TransactionProgramRepository *repository.TransactionProgramRepository
}

func NewTransactionProgramService(transactionProgramRepository *repository.TransactionProgramRepository) TransactionProgramService {
	return TransactionProgramService{
		TransactionProgramRepository: transactionProgramRepository,
	}
}

func (service *TransactionProgramService) Create(ctx context.Context, request model.CreateTransactionProgramRequest) (model.TransactionProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	transactionProgram := entity.TransactionProgram{
		UserID:     uuid.MustParse(request.UserID),
		ProgramID:  uuid.MustParse(request.ProgramID),
		Status:     request.Status,
		Motivation: request.Motivation,
	}

	transactionProgram = service.TransactionProgramRepository.Create(ctx, transactionProgram)

	return model.TransactionProgramResponse{
		TransactionProgramID: transactionProgram.TransactionProgramID,
		UserID:               transactionProgram.UserID,
		ProgramID:            transactionProgram.ProgramID,
		Status:               transactionProgram.Status,
		Motivation:           transactionProgram.Motivation,
		CreatedAt:            transactionProgram.CreatedAt,
		UpdatedAt:            transactionProgram.UpdatedAt,
	}, nil
}

func (service *TransactionProgramService) Update(ctx context.Context, request model.UpdateTransactionProgramRequest, transactionProgramID string) (model.TransactionProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	transactionProgram := entity.TransactionProgram{
		TransactionProgramID: uuid.MustParse(transactionProgramID),
		UserID:               uuid.MustParse(request.UserID),
		ProgramID:            uuid.MustParse(request.ProgramID),
		Status:               request.Status,
		Motivation:           request.Motivation,
	}

	transactionProgram = service.TransactionProgramRepository.Update(ctx, transactionProgram)

	return model.TransactionProgramResponse{
		TransactionProgramID: transactionProgram.TransactionProgramID,
		UserID:               transactionProgram.UserID,
		ProgramID:            transactionProgram.ProgramID,
		Status:               transactionProgram.Status,
		Motivation:           transactionProgram.Motivation,
		CreatedAt:            transactionProgram.CreatedAt,
		UpdatedAt:            transactionProgram.UpdatedAt,
	}, nil
}

func (service *TransactionProgramService) Delete(ctx context.Context, transactionProgramID string) error {

	transactionProgram, err := service.TransactionProgramRepository.FindById(ctx, transactionProgramID)
	if err != nil {
		return err
	}

	service.TransactionProgramRepository.Delete(ctx, transactionProgram)

	return nil
}

func (service *TransactionProgramService) FindById(ctx context.Context, transactionProgramID string) (model.TransactionProgramResponse, error) {
	transactionProgram, err := service.TransactionProgramRepository.FindById(ctx, transactionProgramID)
	if err != nil {
		return model.TransactionProgramResponse{}, err
	}

	return model.TransactionProgramResponse{
		TransactionProgramID: transactionProgram.TransactionProgramID,
		UserID:               transactionProgram.UserID,
		ProgramID:            transactionProgram.ProgramID,
		Status:               transactionProgram.Status,
		Motivation:           transactionProgram.Motivation,
		CreatedAt:            transactionProgram.CreatedAt,
		UpdatedAt:            transactionProgram.UpdatedAt,
	}, nil
}

func (service *TransactionProgramService) FindAll(ctx context.Context, params model.FindAllTransactionProgramsRequest) []model.TransactionProgramResponse {
	transactionPrograms := service.TransactionProgramRepository.FindAll(ctx, params)

	var response []model.TransactionProgramResponse
	for _, transactionProgram := range transactionPrograms {
		response = append(response, model.TransactionProgramResponse{
			TransactionProgramID: transactionProgram.TransactionProgramID,
			UserID:               transactionProgram.UserID,
			ProgramID:            transactionProgram.ProgramID,
			Status:               transactionProgram.Status,
			Motivation:           transactionProgram.Motivation,
			CreatedAt:            transactionProgram.CreatedAt,
			UpdatedAt:            transactionProgram.UpdatedAt,
		})
	}

	return response
}
