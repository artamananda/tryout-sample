package service

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	"github.com/google/uuid"
)

type QuestionService struct {
	QuestionRepository *repository.QuestionRepository
	Uploader           *s3manager.Uploader
}

func NewQuestionService(questionRepository *repository.QuestionRepository, uploader *s3manager.Uploader) QuestionService {
	return QuestionService{
		QuestionRepository: questionRepository,
		Uploader:           uploader,
	}
}

func (service *QuestionService) Create(ctx context.Context, request model.CreateQuestionRequest, tryoutID string) (model.QuestionResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.QuestionResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	question := entity.Question{
		TryoutID:      uuid.MustParse(tryoutID),
		LocalID:       request.LocalID,
		Type:          request.Type,
		Text:          request.Text,
		ImageUrl:      request.ImageUrl,
		IsOptions:     request.IsOptions,
		Options:       request.Options,
		CorrectAnswer: request.CorrectAnswer,
		Points:        request.Points,
	}

	question, err = service.QuestionRepository.Create(ctx, question)

	if err != nil {
		return model.QuestionResponse{}, err
	}

	return model.QuestionResponse{
		QuestionID:    question.QuestionID,
		TryoutID:      question.TryoutID,
		LocalID:       question.LocalID,
		Type:          question.Type,
		Text:          question.Text,
		IsOptions:     question.IsOptions,
		ImageUrl:      question.ImageUrl,
		Options:       question.Options,
		CorrectAnswer: question.CorrectAnswer,
		Points:        question.Points,
	}, nil
}

func (service *QuestionService) Update(ctx context.Context, request model.UpdateQuestionRequest, questionID string) (model.QuestionResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.QuestionResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	question, err := service.QuestionRepository.FindByID(ctx, uuid.MustParse(questionID))
	if err != nil {
		return model.QuestionResponse{}, err
	}

	question.LocalID = request.LocalID
	question.Type = request.Type
	question.Text = request.Text
	question.ImageUrl = request.ImageUrl
	question.IsOptions = request.IsOptions
	question.Options = request.Options
	question.CorrectAnswer = request.CorrectAnswer
	question.Points = request.Points

	question, err = service.QuestionRepository.Update(ctx, question)

	if err != nil {
		return model.QuestionResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.QuestionResponse{
		QuestionID:    question.QuestionID,
		TryoutID:      question.TryoutID,
		LocalID:       question.LocalID,
		Type:          question.Type,
		Text:          question.Text,
		ImageUrl:      question.ImageUrl,
		IsOptions:     question.IsOptions,
		Options:       question.Options,
		CorrectAnswer: question.CorrectAnswer,
		Points:        question.Points,
	}, nil
}

func (service *QuestionService) UpdateImage(ctx context.Context, request model.UploadFileRequest, questionID string) (model.QuestionResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.QuestionResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	question, err := service.QuestionRepository.FindByID(ctx, uuid.MustParse(questionID))
	if err != nil {
		return model.QuestionResponse{}, err
	}

	fileLink, err := helper.UploadFile(service.Uploader, request)

	if err != nil {
		return model.QuestionResponse{}, err
	}

	question.ImageUrl = fileLink

	question, err = service.QuestionRepository.Update(ctx, question)

	if err != nil {
		return model.QuestionResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.QuestionResponse{
		QuestionID:    question.QuestionID,
		TryoutID:      question.TryoutID,
		LocalID:       question.LocalID,
		Type:          question.Type,
		Text:          question.Text,
		ImageUrl:      question.ImageUrl,
		IsOptions:     question.IsOptions,
		Options:       question.Options,
		CorrectAnswer: question.CorrectAnswer,
		Points:        question.Points,
	}, nil
}

func (service *QuestionService) Delete(ctx context.Context, questionID string) error {
	err := service.QuestionRepository.Delete(ctx, uuid.MustParse(questionID))
	if err != nil {
		return err
	}
	return nil
}

func (service *QuestionService) FindByID(ctx context.Context, questionID string) (model.QuestionResponse, error) {
	question, err := service.QuestionRepository.FindByID(ctx, uuid.MustParse(questionID))
	if err != nil {
		return model.QuestionResponse{}, err
	}

	return model.QuestionResponse{
		QuestionID:    question.QuestionID,
		TryoutID:      question.TryoutID,
		LocalID:       question.LocalID,
		Type:          question.Type,
		Text:          question.Text,
		ImageUrl:      question.ImageUrl,
		IsOptions:     question.IsOptions,
		Options:       question.Options,
		CorrectAnswer: question.CorrectAnswer,
		Points:        question.Points,
	}, nil
}

func (service *QuestionService) FindByTryoutID(ctx context.Context, tryoutID string) ([]model.QuestionResponse, error) {
	questions, err := service.QuestionRepository.FindByTryoutID(ctx, uuid.MustParse(tryoutID))
	if err != nil {
		return nil, err
	}

	var questionResponses []model.QuestionResponse
	for _, question := range questions {
		questionResponses = append(questionResponses, model.QuestionResponse{
			QuestionID:    question.QuestionID,
			TryoutID:      question.TryoutID,
			LocalID:       question.LocalID,
			Type:          question.Type,
			Text:          question.Text,
			ImageUrl:      question.ImageUrl,
			IsOptions:     question.IsOptions,
			Options:       question.Options,
			CorrectAnswer: question.CorrectAnswer,
			Points:        question.Points,
		})
	}
	if len(questions) == 0 {
		return []model.QuestionResponse{}, nil
	}
	return questionResponses, nil
}

func (service *QuestionService) FindAll(ctx context.Context) ([]model.QuestionResponse, error) {
	questions, err := service.QuestionRepository.FindAll(ctx)
	if err != nil {
		return []model.QuestionResponse{}, err
	}

	questionResponses := []model.QuestionResponse{}
	for _, question := range questions {
		questionResponses = append(questionResponses,
			model.QuestionResponse{
				QuestionID:    question.QuestionID,
				TryoutID:      question.TryoutID,
				LocalID:       question.LocalID,
				Type:          question.Type,
				Text:          question.Text,
				ImageUrl:      question.ImageUrl,
				IsOptions:     question.IsOptions,
				Options:       question.Options,
				CorrectAnswer: question.CorrectAnswer,
				Points:        question.Points,
			},
		)
	}
	if len(questions) == 0 {
		return []model.QuestionResponse{}, nil
	}
	return questionResponses, nil
}
