package service

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type TransactionProgramService struct {
	TransactionProgramRepository *repository.TransactionProgramRepository
	ProgramRepository            *repository.ProgramRepository
}

func NewTransactionProgramService(transactionProgramRepository *repository.TransactionProgramRepository, programRepository *repository.ProgramRepository) TransactionProgramService {
	return TransactionProgramService{
		TransactionProgramRepository: transactionProgramRepository,
		ProgramRepository:            programRepository,
	}
}

func (service *TransactionProgramService) Create(ctx context.Context, request model.CreateTransactionProgramRequest) (model.TransactionProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	resProgram, err := service.ProgramRepository.FindByID(ctx, uuid.MustParse(request.ProgramID))
	if err != nil {
		return model.TransactionProgramResponse{}, exception.NotFoundError{
			Message: "Program not found",
		}
	}

	if time.Now().Before(resProgram.OpenRegistration) {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: "Registration is not open yet",
		}
	}

	if time.Now().After(resProgram.CloseRegistration) {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: "Registration is closed",
		}
	}

	resTransactionProgram := service.TransactionProgramRepository.FindAll(ctx, model.FindAllTransactionProgramsRequest{
		ProgramID: request.ProgramID,
	})

	for _, transactionProgram := range resTransactionProgram {
		if transactionProgram.UserID.String() == request.UserID {
			return model.TransactionProgramResponse{}, exception.ValidationError{
				Message: "User already registered to this program",
			}
		}
	}

	if len(resTransactionProgram) >= resProgram.MaxParticipants {
		return model.TransactionProgramResponse{}, exception.ValidationError{
			Message: "The program has reached the maximum number of participants",
		}
	}

	var invoiceNumber = "INV-" + uuid.New().String()[:8]

	transactionProgram := entity.TransactionProgram{
		UserID:        uuid.MustParse(request.UserID),
		ProgramID:     uuid.MustParse(request.ProgramID),
		Status:        request.Status,
		Motivation:    request.Motivation,
		InvoiceNumber: invoiceNumber,
	}

	transactionProgram = service.TransactionProgramRepository.Create(ctx, transactionProgram)

	return model.TransactionProgramResponse{
		TransactionProgramID: transactionProgram.TransactionProgramID,
		UserID:               transactionProgram.UserID,
		ProgramID:            transactionProgram.ProgramID,
		Status:               transactionProgram.Status,
		Motivation:           transactionProgram.Motivation,
		InvoiceNumber:        transactionProgram.InvoiceNumber,
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
		InvoiceNumber:        transactionProgram.InvoiceNumber,
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

	userDataRespone := model.GetUserResponse{
		UserID:     transactionProgram.User.UserID,
		Name:       transactionProgram.User.Name,
		Username:   transactionProgram.User.Username,
		Email:      transactionProgram.User.Email,
		PictureURL: transactionProgram.User.PictureURL,
		Role:       transactionProgram.User.Role,
		NISN:       transactionProgram.User.NISN,
		Grade:      transactionProgram.User.Grade,
		School:     transactionProgram.User.School,
		Regency:    transactionProgram.User.Regency,
		Province:   transactionProgram.User.Province,
		CreatedAt:  transactionProgram.User.CreatedAt,
	}
	programDataRespone := model.ProgramResponse{
		ProgramID:         transactionProgram.Program.ProgramID,
		Name:              transactionProgram.Program.Name,
		Description:       transactionProgram.Program.Description,
		MaxParticipants:   transactionProgram.Program.MaxParticipants,
		IsPublished:       transactionProgram.Program.IsPublished,
		PictureURL:        transactionProgram.Program.PictureURL,
		StartTime:         transactionProgram.Program.StartTime,
		EndTime:           transactionProgram.Program.EndTime,
		OpenRegistration:  transactionProgram.Program.OpenRegistration,
		CloseRegistration: transactionProgram.Program.CloseRegistration,
		CreatedAt:         transactionProgram.Program.CreatedAt,
		UpdatedAt:         transactionProgram.Program.UpdatedAt,
	}

	return model.TransactionProgramResponse{
		TransactionProgramID: transactionProgram.TransactionProgramID,
		UserID:               transactionProgram.UserID,
		User:                 userDataRespone,
		ProgramID:            transactionProgram.ProgramID,
		Program:              programDataRespone,
		Status:               transactionProgram.Status,
		Motivation:           transactionProgram.Motivation,
		InvoiceNumber:        transactionProgram.InvoiceNumber,
		CreatedAt:            transactionProgram.CreatedAt,
		UpdatedAt:            transactionProgram.UpdatedAt,
	}, nil
}

func (service *TransactionProgramService) FindAll(ctx context.Context, params model.FindAllTransactionProgramsRequest) []model.TransactionProgramResponse {
	transactionPrograms := service.TransactionProgramRepository.FindAll(ctx, params)

	var response []model.TransactionProgramResponse
	for _, transactionProgram := range transactionPrograms {
		userDataRespone := model.GetUserResponse{
			UserID:     transactionProgram.User.UserID,
			Name:       transactionProgram.User.Name,
			Username:   transactionProgram.User.Username,
			Email:      transactionProgram.User.Email,
			PictureURL: transactionProgram.User.PictureURL,
			Role:       transactionProgram.User.Role,
			NISN:       transactionProgram.User.NISN,
			Grade:      transactionProgram.User.Grade,
			School:     transactionProgram.User.School,
			Regency:    transactionProgram.User.Regency,
			Province:   transactionProgram.User.Province,
			CreatedAt:  transactionProgram.User.CreatedAt,
		}
		programDataRespone := model.ProgramResponse{
			ProgramID:         transactionProgram.Program.ProgramID,
			Name:              transactionProgram.Program.Name,
			Description:       transactionProgram.Program.Description,
			MaxParticipants:   transactionProgram.Program.MaxParticipants,
			IsPublished:       transactionProgram.Program.IsPublished,
			PictureURL:        transactionProgram.Program.PictureURL,
			StartTime:         transactionProgram.Program.StartTime,
			EndTime:           transactionProgram.Program.EndTime,
			OpenRegistration:  transactionProgram.Program.OpenRegistration,
			CloseRegistration: transactionProgram.Program.CloseRegistration,
			CreatedAt:         transactionProgram.Program.CreatedAt,
			UpdatedAt:         transactionProgram.Program.UpdatedAt,
		}

		response = append(response, model.TransactionProgramResponse{
			TransactionProgramID: transactionProgram.TransactionProgramID,
			UserID:               transactionProgram.UserID,
			User:                 userDataRespone,
			ProgramID:            transactionProgram.ProgramID,
			Program:              programDataRespone,
			Status:               transactionProgram.Status,
			Motivation:           transactionProgram.Motivation,
			InvoiceNumber:        transactionProgram.InvoiceNumber,
			CreatedAt:            transactionProgram.CreatedAt,
			UpdatedAt:            transactionProgram.UpdatedAt,
		})
	}

	return response
}
