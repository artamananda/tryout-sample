package service

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type LearningVideoService struct {
	LearningVideoRepository *repository.LearningVideoRepository
}

func NewLearningVideoService(learningVideoRepository *repository.LearningVideoRepository) LearningVideoService {
	return LearningVideoService{
		LearningVideoRepository: learningVideoRepository,
	}
}

func (service *LearningVideoService) Create(ctx context.Context, request model.CreateLearningVideoRequest) (model.LearningVideoResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.LearningVideoResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	learningVideo := entity.LearningVideo{
		Title:     request.Title,
		URL:       request.URL,
		ProgramID: request.ProgramID,
	}

	learningVideo, err = service.LearningVideoRepository.Create(ctx, learningVideo)
	if err != nil {
		return model.LearningVideoResponse{}, err
	}

	return service.entityToResponse(learningVideo), nil
}

func (service *LearningVideoService) FindByID(ctx context.Context, id int) (model.LearningVideoResponse, error) {
	learningVideo, err := service.LearningVideoRepository.FindByID(ctx, id)
	if err != nil {
		return model.LearningVideoResponse{}, err
	}

	return service.entityToResponse(learningVideo), nil
}

func (service *LearningVideoService) Update(ctx context.Context, id int, request model.UpdateLearningVideoRequest) (model.LearningVideoResponse, error) {
	// Check if learning video exists
	learningVideo, err := service.LearningVideoRepository.FindByID(ctx, id)
	if err != nil {
		return model.LearningVideoResponse{}, err
	}

	// Update fields if provided
	if request.Title != "" {
		learningVideo.Title = request.Title
	}
	if request.URL != "" {
		learningVideo.URL = request.URL
	}
	if request.ProgramID != nil {
		learningVideo.ProgramID = request.ProgramID
	}

	learningVideo.UpdatedAt = time.Now()

	learningVideo, err = service.LearningVideoRepository.Update(ctx, learningVideo)
	if err != nil {
		return model.LearningVideoResponse{}, err
	}

	return service.entityToResponse(learningVideo), nil
}

func (service *LearningVideoService) Delete(ctx context.Context, id int) error {
	// Check if learning video exists
	_, err := service.LearningVideoRepository.FindByID(ctx, id)
	if err != nil {
		return err
	}

	err = service.LearningVideoRepository.Delete(ctx, id)
	if err != nil {
		return err
	}

	return nil
}

func (service *LearningVideoService) FindAll(ctx context.Context, request model.FindAllLearningVideoRequest) ([]model.LearningVideoResponse, int64, error) {
	if request.Page < 1 {
		request.Page = 1
	}
	if request.PageSize < 1 {
		request.PageSize = 10
	}

	offset := (request.Page - 1) * request.PageSize

	learningVideos, total, err := service.LearningVideoRepository.FindAll(ctx, request.Search, request.ProgramID, offset, request.PageSize)
	if err != nil {
		return []model.LearningVideoResponse{}, 0, err
	}

	var responses []model.LearningVideoResponse
	for _, learningVideo := range learningVideos {
		responses = append(responses, service.entityToResponse(learningVideo))
	}

	return responses, total, nil
}

func (service *LearningVideoService) entityToResponse(learningVideo entity.LearningVideo) model.LearningVideoResponse {
	return model.LearningVideoResponse{
		ID:        learningVideo.ID,
		Title:     learningVideo.Title,
		URL:       learningVideo.URL,
		ProgramID: learningVideo.ProgramID,
		CreatedAt: learningVideo.CreatedAt,
		UpdatedAt: learningVideo.UpdatedAt,
	}
}
