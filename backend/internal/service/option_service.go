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

type OptionService struct {
	OptionRepository *repository.OptionRepository
}

func NewOptionService(optionRepository *repository.OptionRepository) OptionService {
	return OptionService{
		OptionRepository: optionRepository,
	}
}

func (service *OptionService) Create(ctx context.Context, request model.OptionRequest, questionID string) (model.OptionResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.OptionResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	option := entity.Option{
		Text: request.Text,
	}

	question, err := service.OptionRepository.Create(ctx, option)
	if err != nil {
		return model.OptionResponse{}, err
	}

	return model.OptionResponse{
		OptionID:   question.OptionID,
		QuestionID: question.QuestionID,
		Text:       question.Text,
	}, nil
}

func (service *OptionService) Update(ctx context.Context, request model.OptionRequest, optionID string) (model.OptionResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.OptionResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	option, err := service.OptionRepository.FindByID(ctx, uuid.MustParse(optionID))
	if err != nil {
		return model.OptionResponse{}, err
	}

	option.Text = request.Text

	option, err = service.OptionRepository.Update(ctx, option)
	if err != nil {
		return model.OptionResponse{}, err
	}

	return model.OptionResponse{
		OptionID:   option.OptionID,
		QuestionID: option.QuestionID,
		Text:       option.Text,
	}, nil
}

func (service *OptionService) Delete(ctx context.Context, optionID string) error {
	err := service.OptionRepository.Delete(ctx, uuid.MustParse(optionID))
	if err != nil {
		return err
	}
	return nil
}

func (service *OptionService) FindByID(ctx context.Context, optionID string) (model.OptionResponse, error) {
	option, err := service.OptionRepository.FindByID(ctx, uuid.MustParse(optionID))
	if err != nil {
		return model.OptionResponse{}, err
	}

	return model.OptionResponse{
		OptionID:   option.OptionID,
		QuestionID: option.QuestionID,
		Text:       option.Text,
	}, nil
}

func (service *OptionService) FindAllByQuestionID(ctx context.Context, questionID string) ([]model.OptionResponse, error) {
	options, err := service.OptionRepository.FindAllByQuestionID(ctx, uuid.MustParse(questionID))
	if err != nil {
		return []model.OptionResponse{}, err
	}

	optionResponses := []model.OptionResponse{}
	for _, option := range options {
		optionResponses = append(optionResponses,
			model.OptionResponse{
				OptionID:   option.OptionID,
				QuestionID: option.QuestionID,
				Text:       option.Text,
			},
		)
	}
	if len(options) == 0 {
		return []model.OptionResponse{}, nil
	}
	return optionResponses, nil
}
