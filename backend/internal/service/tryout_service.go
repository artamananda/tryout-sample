package service

import (
	"context"
	"fmt"
	"math/rand"
	"sort"
	"strings"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type TryoutService struct {
	TryoutRepository   *repository.TryoutRepository
	QuestionRepository *repository.QuestionRepository
	BankSoalRepository *repository.BankSoalRepository
}

func NewTryoutService(
	tryoutRepository *repository.TryoutRepository,
	questionRepository *repository.QuestionRepository,
	bankSoalRepository *repository.BankSoalRepository,
) TryoutService {
	return TryoutService{
		TryoutRepository:   tryoutRepository,
		QuestionRepository: questionRepository,
		BankSoalRepository: bankSoalRepository,
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
		ProgramID:   request.ProgramID,
		Title:       request.Title,
		Duration:    request.Duration,
		StartTime:   request.StartTime,
		EndTime:     request.EndTime,
		Token:       helper.GenerateOTP(6),
		IsPublished: request.IsPublished,
		ShowScore:   request.ShowScore,
		Sequence:    request.Sequence,
		ScoringMode: request.ScoringMode,
	}
	if tryout.ScoringMode == "" {
		tryout.ScoringMode = entity.ScoringModeIRT
	}

	tryout = service.TryoutRepository.Create(ctx, tryout)

	generatedQuestionCount := 0
	if request.GenerateFromBankSoal {
		generatedQuestionCount, err = service.generateQuestionsFromBankSoal(ctx, tryout.TryoutID, request.BankSoalDistribution)
		if err != nil {
			return model.TryoutResponse{}, err
		}
	}

	return model.TryoutResponse{
		TryoutID:               tryout.TryoutID,
		ProgramID:              tryout.ProgramID,
		Title:                  tryout.Title,
		Duration:               tryout.Duration,
		StartTime:              tryout.StartTime,
		EndTime:                tryout.EndTime,
		Token:                  tryout.Token,
		IsPublished:            tryout.IsPublished,
		ShowScore:              tryout.ShowScore,
		Sequence:               tryout.Sequence,
		ScoringMode:            tryout.ScoringMode,
		GeneratedQuestionCount: generatedQuestionCount,
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

	if request.Title != nil {
		tryout.Title = *request.Title
	}

	if request.ProgramID != nil {
		tryout.ProgramID = request.ProgramID
	}

	if request.Duration != nil {
		tryout.Duration = *request.Duration
	}

	if request.StartTime != nil {
		tryout.StartTime = *request.StartTime
	}

	if request.EndTime != nil {
		tryout.EndTime = *request.EndTime
	}

	if request.IsPublished != nil {
		tryout.IsPublished = *request.IsPublished
	}

	if request.ShowScore != nil {
		tryout.ShowScore = *request.ShowScore
	}

	if request.Sequence != nil {
		tryout.Sequence = *request.Sequence
	}

	if request.ScoringMode != nil {
		tryout.ScoringMode = *request.ScoringMode
	}
	if tryout.ScoringMode == "" {
		tryout.ScoringMode = entity.ScoringModeIRT
	}

	tryout = service.TryoutRepository.Update(ctx, tryout)

	return model.TryoutResponse{
		TryoutID:    tryout.TryoutID,
		ProgramID:   tryout.ProgramID,
		Title:       tryout.Title,
		Duration:    tryout.Duration,
		StartTime:   tryout.StartTime,
		EndTime:     tryout.EndTime,
		Token:       tryout.Token,
		IsPublished: tryout.IsPublished,
		ShowScore:   tryout.ShowScore,
		Sequence:    tryout.Sequence,
		ScoringMode: tryout.ScoringMode,
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
		TryoutID:    tryout.TryoutID,
		ProgramID:   tryout.ProgramID,
		Title:       tryout.Title,
		Duration:    tryout.Duration,
		StartTime:   tryout.StartTime,
		EndTime:     tryout.EndTime,
		IsPublished: tryout.IsPublished,
		ShowScore:   tryout.ShowScore,
		Sequence:    tryout.Sequence,
		ScoringMode: tryout.ScoringMode,
	}, nil
}

func (service *TryoutService) FindAll(ctx context.Context, params model.FindAllTryoutRequest) []model.TryoutResponse {
	tryouts := service.TryoutRepository.FindAll(ctx, params)

	tryoutResponses := []model.TryoutResponse{}
	for _, tryout := range tryouts {
		tryoutResponses = append(tryoutResponses,
			model.TryoutResponse{
				TryoutID:    tryout.TryoutID,
				ProgramID:   tryout.ProgramID,
				Title:       tryout.Title,
				Duration:    tryout.Duration,
				StartTime:   tryout.StartTime,
				EndTime:     tryout.EndTime,
				IsPublished: tryout.IsPublished,
				ShowScore:   tryout.ShowScore,
				Sequence:    tryout.Sequence,
				ScoringMode: tryout.ScoringMode,
			},
		)
	}
	if len(tryouts) == 0 {
		return []model.TryoutResponse{}
	}
	return tryoutResponses
}

func (service *TryoutService) FindAllAsAdmin(ctx context.Context, params model.FindAllTryoutRequest) []model.TryoutResponse {
	tryouts := service.TryoutRepository.FindAll(ctx, params)

	tryoutResponses := []model.TryoutResponse{}
	for _, tryout := range tryouts {
		tryoutResponses = append(tryoutResponses,
			model.TryoutResponse{
				TryoutID:    tryout.TryoutID,
				ProgramID:   tryout.ProgramID,
				Title:       tryout.Title,
				Duration:    tryout.Duration,
				StartTime:   tryout.StartTime,
				EndTime:     tryout.EndTime,
				Token:       tryout.Token,
				IsPublished: tryout.IsPublished,
				ShowScore:   tryout.ShowScore,
				Sequence:    tryout.Sequence,
				ScoringMode: tryout.ScoringMode,
			},
		)
	}
	if len(tryouts) == 0 {
		return []model.TryoutResponse{}
	}
	return tryoutResponses
}

func (service *TryoutService) CheckTryoutToken(ctx context.Context, tryoutID string, token string) bool {
	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return false
	}

	if tryout.Token == token {
		return true
	}

	return false
}

func (service *TryoutService) generateQuestionsFromBankSoal(
	ctx context.Context,
	tryoutID uuid.UUID,
	distribution []model.CreateTryoutBankSoalItemRequest,
) (int, error) {
	if len(distribution) == 0 {
		return 0, exception.ValidationError{Message: "bank_soal_distribution is required when generate_from_bank_soal is true"}
	}

	aggregated := map[string]int{}
	for _, item := range distribution {
		if item.Type == "" {
			return 0, exception.ValidationError{Message: "bank_soal_distribution.type is required"}
		}
		if item.Count <= 0 {
			return 0, exception.ValidationError{Message: "bank_soal_distribution.count must be greater than 0"}
		}
		aggregated[item.Type] += item.Count
	}

	types := make([]string, 0, len(aggregated))
	for questionType := range aggregated {
		types = append(types, questionType)
	}
	sort.Strings(types)

	questionsToCreate := make([]entity.Question, 0)
	localID := 1
	for _, questionType := range types {
		count := aggregated[questionType]
		bankSoals, err := service.BankSoalRepository.FindRandomAvailableByType(ctx, questionType, count)
		if err != nil {
			return 0, err
		}

		if len(bankSoals) < count {
			return 0, exception.ValidationError{
				Message: fmt.Sprintf("bank soal tipe %s tersedia %d, dibutuhkan %d", questionType, len(bankSoals), count),
			}
		}

		for _, bankSoal := range bankSoals {
			options, optionScores := shuffleOptions(bankSoal.Type, bankSoal.Options, bankSoal.OptionScores)
			bankSoalID := bankSoal.BankSoalID
			questionsToCreate = append(questionsToCreate, entity.Question{
				TryoutID:      tryoutID,
				BankSoalID:    &bankSoalID,
				LocalID:       localID,
				Type:          bankSoal.Type,
				Text:          bankSoal.Text,
				ImageUrl:      bankSoal.ImageUrl,
				IsOptions:     bankSoal.IsOptions,
				Options:       options,
				CorrectAnswer: bankSoal.CorrectAnswer,
				OptionScores:  optionScores,
				Explanation:   bankSoal.Explanation,
				Points:        bankSoal.Points,
			})
			localID++
		}
	}

	if len(questionsToCreate) == 0 {
		return 0, exception.ValidationError{Message: "no questions generated from bank soal"}
	}

	_, err := service.QuestionRepository.CreateBatch(ctx, questionsToCreate)
	if err != nil {
		return 0, err
	}

	return len(questionsToCreate), nil
}

// shuffleOptions puts the options of a generated question in random order so
// the right answer is not always in the same place. Answers are stored as
// option text, so the correct answer stays valid; TKP weights move with their
// option. TKP questions without weights get the generator's convention
// (first option 5 down to last option 1) before shuffling.
func shuffleOptions(questionType string, options []string, scores pq.Int64Array) (pq.StringArray, pq.Int64Array) {
	if len(options) < 2 {
		return pq.StringArray(options), scores
	}
	if strings.EqualFold(strings.TrimSpace(questionType), "tkp") && len(scores) != len(options) {
		scores = make(pq.Int64Array, len(options))
		for i := range options {
			value := int64(5 - i)
			if value < 1 {
				value = 1
			}
			scores[i] = value
		}
	}
	hasScores := len(scores) == len(options)

	order := rand.Perm(len(options))
	shuffled := make(pq.StringArray, len(options))
	var shuffledScores pq.Int64Array
	if hasScores {
		shuffledScores = make(pq.Int64Array, len(options))
	}
	for to, from := range order {
		shuffled[to] = options[from]
		if hasScores {
			shuffledScores[to] = scores[from]
		}
	}
	return shuffled, shuffledScores
}
