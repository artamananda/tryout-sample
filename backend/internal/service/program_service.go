package service

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/aws/aws-sdk-go-v2/feature/s3/manager"
	"github.com/google/uuid"
)

type ProgramService struct {
	ProgramRepository *repository.ProgramRepository
	Uploader          *manager.Uploader
}

func NewProgramService(programRepository *repository.ProgramRepository, uploader *manager.Uploader) ProgramService {
	return ProgramService{
		ProgramRepository: programRepository,
		Uploader:          uploader,
	}
}

func (service *ProgramService) Create(ctx context.Context, request model.CreateProgramRequest) (model.ProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.ProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	program := entity.Program{
		Name:              request.Name,
		Description:       request.Description,
		MaxParticipants:   request.MaxParticipants,
		IsPublished:       request.IsPublished,
		StartTime:         request.StartTime,
		EndTime:           request.EndTime,
		OpenRegistration:  request.OpenRegistration,
		CloseRegistration: request.CloseRegistration,
	}

	program, err = service.ProgramRepository.Create(ctx, program)

	if err != nil {
		return model.ProgramResponse{}, err
	}

	return model.ProgramResponse{
		ProgramID:         program.ProgramID,
		Name:              program.Name,
		Description:       program.Description,
		MaxParticipants:   program.MaxParticipants,
		IsPublished:       program.IsPublished,
		StartTime:         program.StartTime,
		EndTime:           program.EndTime,
		OpenRegistration:  program.OpenRegistration,
		CloseRegistration: program.CloseRegistration,
	}, nil
}

func (service *ProgramService) Update(ctx context.Context, request model.UpdateProgramRequest, programID string) (model.ProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.ProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	program := entity.Program{
		ProgramID:         uuid.MustParse(programID),
		Name:              request.Name,
		Description:       request.Description,
		MaxParticipants:   request.MaxParticipants,
		IsPublished:       request.IsPublished,
		StartTime:         request.StartTime,
		EndTime:           request.EndTime,
		OpenRegistration:  request.OpenRegistration,
		CloseRegistration: request.CloseRegistration,
	}

	program, err = service.ProgramRepository.Update(ctx, program)

	if err != nil {
		return model.ProgramResponse{}, err
	}

	return model.ProgramResponse{
		ProgramID:         program.ProgramID,
		Name:              program.Name,
		Description:       program.Description,
		MaxParticipants:   program.MaxParticipants,
		IsPublished:       program.IsPublished,
		StartTime:         program.StartTime,
		EndTime:           program.EndTime,
		OpenRegistration:  program.OpenRegistration,
		CloseRegistration: program.CloseRegistration,
	}, nil
}

func (service *ProgramService) UpdateImage(ctx context.Context, request model.UploadFileRequest, programID string) (model.ProgramResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.ProgramResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	program, err := service.ProgramRepository.FindByID(ctx, uuid.MustParse(programID))
	if err != nil {
		return model.ProgramResponse{}, err
	}

	fileLink, err := helper.UploadFile(service.Uploader, request)

	if err != nil {
		return model.ProgramResponse{}, err
	}

	program.PictureURL = fileLink
	program.UpdatedAt = time.Now()

	program, err = service.ProgramRepository.Update(ctx, program)

	if err != nil {
		return model.ProgramResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.ProgramResponse{
		ProgramID:         program.ProgramID,
		Name:              program.Name,
		Description:       program.Description,
		MaxParticipants:   program.MaxParticipants,
		IsPublished:       program.IsPublished,
		PictureURL:        program.PictureURL,
		StartTime:         program.StartTime,
		EndTime:           program.EndTime,
		OpenRegistration:  program.OpenRegistration,
		CloseRegistration: program.CloseRegistration,
	}, nil
}

func (service *ProgramService) Delete(ctx context.Context, programID string) error {
	err := service.ProgramRepository.Delete(ctx, uuid.MustParse(programID))
	if err != nil {
		return err
	}
	return nil
}

func (service *ProgramService) FindByID(ctx context.Context, programID string) (model.ProgramResponse, error) {
	program, err := service.ProgramRepository.FindByID(ctx, uuid.MustParse(programID))
	if err != nil {
		return model.ProgramResponse{}, err
	}
	return model.ProgramResponse{
		ProgramID:         program.ProgramID,
		Name:              program.Name,
		Description:       program.Description,
		MaxParticipants:   program.MaxParticipants,
		IsPublished:       program.IsPublished,
		StartTime:         program.StartTime,
		EndTime:           program.EndTime,
		OpenRegistration:  program.OpenRegistration,
		CloseRegistration: program.CloseRegistration,
	}, nil
}

func (service *ProgramService) FindAll(ctx context.Context, request model.FindAllProgramsRequest) ([]model.ProgramResponse, error) {
	programs := service.ProgramRepository.FindAll(ctx, request)

	var response []model.ProgramResponse
	for _, program := range programs {
		response = append(response, model.ProgramResponse{
			ProgramID:         program.ProgramID,
			Name:              program.Name,
			Description:       program.Description,
			MaxParticipants:   program.MaxParticipants,
			IsPublished:       program.IsPublished,
			StartTime:         program.StartTime,
			EndTime:           program.EndTime,
			OpenRegistration:  program.OpenRegistration,
			CloseRegistration: program.CloseRegistration,
		})
	}

	return response, nil
}
