package service

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type BankSoalService struct {
	BankSoalRepository *repository.BankSoalRepository
}

var optionLabelPrefixPattern = regexp.MustCompile(`(?i)^[A-E]\.\s*`)

func NewBankSoalService(bankSoalRepository *repository.BankSoalRepository) BankSoalService {
	return BankSoalService{
		BankSoalRepository: bankSoalRepository,
	}
}

func (service *BankSoalService) Create(ctx context.Context, request model.CreateBankSoalRequest, userID string) (model.BankSoalResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.BankSoalResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	isOptions := true
	if request.IsOptions != nil {
		isOptions = *request.IsOptions
	}

	normalizedOptions := normalizeOptions(request.Options)
	correctAnswer := normalizeCorrectAnswer(request.CorrectAnswer, normalizedOptions)

	bankSoal := entity.BankSoal{
		Type:          request.Type,
		Text:          request.Text,
		ImageUrl:      request.ImageUrl,
		IsOptions:     &isOptions,
		Options:       normalizedOptions,
		CorrectAnswer: correctAnswer,
		Explanation:   request.Explanation,
		Difficulty:    request.Difficulty,
		Topic:         request.Topic,
		Points:        request.Points,
		IsAIGenerated: request.IsAIGenerated,
		CreatedBy:     uuid.MustParse(userID),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	bankSoal, err = service.BankSoalRepository.Create(ctx, bankSoal)
	if err != nil {
		return model.BankSoalResponse{}, err
	}

	return toResponse(bankSoal), nil
}

func (service *BankSoalService) CreateBatch(ctx context.Context, request model.CreateBankSoalBatchRequest, userID string) ([]model.BankSoalResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return nil, exception.ValidationError{
			Message: err.Error(),
		}
	}

	var bankSoals []entity.BankSoal
	for _, q := range request.Questions {
		isOptions := true
		if q.IsOptions != nil {
			isOptions = *q.IsOptions
		}

		normalizedOptions := normalizeOptions(q.Options)
		correctAnswer := normalizeCorrectAnswer(q.CorrectAnswer, normalizedOptions)

		bankSoals = append(bankSoals, entity.BankSoal{
			Type:          q.Type,
			Text:          q.Text,
			ImageUrl:      q.ImageUrl,
			IsOptions:     &isOptions,
			Options:       normalizedOptions,
			CorrectAnswer: correctAnswer,
			Explanation:   q.Explanation,
			Difficulty:    q.Difficulty,
			Topic:         q.Topic,
			Points:        q.Points,
			IsAIGenerated: q.IsAIGenerated,
			CreatedBy:     uuid.MustParse(userID),
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		})
	}

	createdBankSoals, err := service.BankSoalRepository.CreateBatch(ctx, bankSoals)
	if err != nil {
		return nil, err
	}

	var responses []model.BankSoalResponse
	for _, bs := range createdBankSoals {
		responses = append(responses, toResponse(bs))
	}

	return responses, nil
}

func (service *BankSoalService) FindByID(ctx context.Context, id string) (model.BankSoalResponse, error) {
	bankSoal, err := service.BankSoalRepository.FindByID(ctx, uuid.MustParse(id))
	if err != nil {
		return model.BankSoalResponse{}, exception.NotFoundError{
			Message: "Bank Soal not found",
		}
	}
	return toResponse(bankSoal), nil
}

func (service *BankSoalService) FindAll(ctx context.Context, includeUsed bool) ([]model.BankSoalResponse, error) {
	bankSoals, err := service.BankSoalRepository.FindAll(ctx, includeUsed)
	if err != nil {
		return nil, err
	}

	var responses []model.BankSoalResponse
	for _, bs := range bankSoals {
		responses = append(responses, toResponse(bs))
	}

	if len(bankSoals) == 0 {
		return []model.BankSoalResponse{}, nil
	}

	return responses, nil
}

func (service *BankSoalService) FindByType(ctx context.Context, questionType string, includeUsed bool) ([]model.BankSoalResponse, error) {
	bankSoals, err := service.BankSoalRepository.FindByType(ctx, questionType, includeUsed)
	if err != nil {
		return nil, err
	}

	var responses []model.BankSoalResponse
	for _, bs := range bankSoals {
		responses = append(responses, toResponse(bs))
	}

	if len(bankSoals) == 0 {
		return []model.BankSoalResponse{}, nil
	}

	return responses, nil
}

func (service *BankSoalService) Delete(ctx context.Context, id string) error {
	err := service.BankSoalRepository.Delete(ctx, uuid.MustParse(id))
	if err != nil {
		return err
	}
	return nil
}

func toResponse(bankSoal entity.BankSoal) model.BankSoalResponse {
	return model.BankSoalResponse{
		BankSoalID:    bankSoal.BankSoalID,
		Type:          bankSoal.Type,
		Text:          bankSoal.Text,
		ImageUrl:      bankSoal.ImageUrl,
		IsOptions:     bankSoal.IsOptions,
		Options:       bankSoal.Options,
		CorrectAnswer: bankSoal.CorrectAnswer,
		Explanation:   bankSoal.Explanation,
		Difficulty:    bankSoal.Difficulty,
		Topic:         bankSoal.Topic,
		Points:        bankSoal.Points,
		IsAIGenerated: bankSoal.IsAIGenerated,
		CreatedBy:     bankSoal.CreatedBy,
		CreatedAt:     bankSoal.CreatedAt,
		UpdatedAt:     bankSoal.UpdatedAt,
	}
}

func (service *BankSoalService) Update(ctx context.Context, id string, request model.CreateBankSoalRequest) (model.BankSoalResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.BankSoalResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	bankSoal, err := service.BankSoalRepository.FindByID(ctx, uuid.MustParse(id))
	if err != nil {
		return model.BankSoalResponse{}, exception.NotFoundError{
			Message: "Bank Soal not found",
		}
	}

	isOptions := true
	if request.IsOptions != nil {
		isOptions = *request.IsOptions
	}

	normalizedOptions := normalizeOptions(request.Options)
	correctAnswer := normalizeCorrectAnswer(request.CorrectAnswer, normalizedOptions)

	bankSoal.Type = request.Type
	bankSoal.Text = request.Text
	bankSoal.ImageUrl = request.ImageUrl
	bankSoal.IsOptions = &isOptions
	bankSoal.Options = normalizedOptions
	bankSoal.CorrectAnswer = correctAnswer
	bankSoal.Explanation = request.Explanation
	bankSoal.Difficulty = request.Difficulty
	bankSoal.Topic = request.Topic
	bankSoal.Points = request.Points
	bankSoal.UpdatedAt = time.Now()

	updatedBankSoal, err := service.BankSoalRepository.Update(ctx, bankSoal)
	if err != nil {
		return model.BankSoalResponse{}, err
	}

	return toResponse(updatedBankSoal), nil
}

func (service *BankSoalService) GetUniqueTypes(ctx context.Context) ([]string, error) {
	return service.BankSoalRepository.GetUniqueTypes(ctx)
}

func (service *BankSoalService) FindPreview(ctx context.Context, questionType string, limit int, includeUsed bool) ([]model.BankSoalResponse, error) {
	bankSoals, err := service.BankSoalRepository.FindPreview(ctx, questionType, limit, includeUsed)
	if err != nil {
		return nil, err
	}

	responses := make([]model.BankSoalResponse, 0, len(bankSoals))
	for _, bs := range bankSoals {
		responses = append(responses, toResponse(bs))
	}

	if len(bankSoals) == 0 {
		return []model.BankSoalResponse{}, nil
	}

	return responses, nil
}

func normalizeCorrectAnswer(correctAnswer string, options []string) string {
	normalized := normalizeOptionText(correctAnswer)
	if normalized == "" {
		return normalized
	}

	if len(options) == 0 {
		return normalized
	}

	if len(normalized) == 1 {
		optionIndex := int(strings.ToUpper(normalized)[0] - 'A')
		if optionIndex >= 0 && optionIndex < len(options) {
			return normalizeOptionText(options[optionIndex])
		}
	}

	for _, option := range options {
		normalizedOption := normalizeOptionText(option)
		if strings.EqualFold(normalizedOption, normalized) {
			return normalizedOption
		}
	}

	return normalized
}

func normalizeOptions(options []string) []string {
	normalized := make([]string, len(options))
	for i, option := range options {
		normalized[i] = normalizeOptionText(option)
	}

	return normalized
}

func normalizeOptionText(text string) string {
	trimmed := strings.TrimSpace(text)
	return optionLabelPrefixPattern.ReplaceAllString(trimmed, "")
}
