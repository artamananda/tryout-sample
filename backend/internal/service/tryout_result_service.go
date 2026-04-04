package service

import (
	"context"
	"encoding/json"
	"math"
	"sort"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

const (
	minScaledScore = 350.0
	maxScaledScore = 1000.0
)

type TryoutResultService struct {
	TryoutRepository            *repository.TryoutRepository
	QuestionRepository          *repository.QuestionRepository
	UserAnswerRepository        *repository.UserAnswerRepository
	UserRepository              *repository.UserRepository
	TryoutResultCacheRepository *repository.TryoutResultCacheRepository
}

func NewTryoutResultService(
	tryoutRepository *repository.TryoutRepository,
	questionRepository *repository.QuestionRepository,
	userAnswerRepository *repository.UserAnswerRepository,
	userRepository *repository.UserRepository,
	tryoutResultCacheRepository *repository.TryoutResultCacheRepository,
) TryoutResultService {
	return TryoutResultService{
		TryoutRepository:            tryoutRepository,
		QuestionRepository:          questionRepository,
		UserAnswerRepository:        userAnswerRepository,
		UserRepository:              userRepository,
		TryoutResultCacheRepository: tryoutResultCacheRepository,
	}
}

func (service *TryoutResultService) FindByTryoutID(ctx context.Context, tryoutID string) (model.TryoutResultResponse, error) {
	cache, err := service.TryoutResultCacheRepository.FindByTryoutID(ctx, tryoutID)
	if err == nil {
		var cachedResult model.TryoutResultResponse
		unmarshalErr := json.Unmarshal(cache.Payload, &cachedResult)
		if unmarshalErr == nil {
			return cachedResult, nil
		}
	}

	result, err := service.BuildByTryoutID(ctx, tryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	_ = service.saveToCache(ctx, result)

	return result, nil
}

func (service *TryoutResultService) RebuildAndCacheByTryoutID(ctx context.Context, tryoutID string) (model.TryoutResultResponse, error) {
	result, err := service.BuildByTryoutID(ctx, tryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	err = service.saveToCache(ctx, result)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	return result, nil
}

func (service *TryoutResultService) FindUserResultByTryoutIDAndUserID(ctx context.Context, tryoutID string, userID string) (model.TryoutUserResultResponse, error) {
	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return model.TryoutUserResultResponse{}, err
	}

	if !tryout.ShowScore {
		return model.TryoutUserResultResponse{}, exception.UnauthorizedError{Message: "score is not published yet"}
	}

	result, err := service.FindByTryoutID(ctx, tryoutID)
	if err != nil {
		return model.TryoutUserResultResponse{}, err
	}

	for _, summary := range result.UserSummary {
		if summary.UserID == userID {
			return model.TryoutUserResultResponse{
				TryoutID:      result.TryoutID,
				UserID:        summary.UserID,
				Name:          summary.Name,
				GeneratedAt:   result.GeneratedAt,
				SubtestScores: summary.SubtestScores,
				TotalScore:    summary.TotalScore,
				AvgScore:      summary.AvgScore,
			}, nil
		}
	}

	return model.TryoutUserResultResponse{}, exception.NotFoundError{Message: "result for user not found"}
}

func (service *TryoutResultService) saveToCache(ctx context.Context, result model.TryoutResultResponse) error {
	payload, err := json.Marshal(result)
	if err != nil {
		return err
	}

	return service.TryoutResultCacheRepository.Upsert(ctx, entity.TryoutResultCache{
		TryoutID:    uuid.MustParse(result.TryoutID),
		Payload:     payload,
		GeneratedAt: result.GeneratedAt,
	})
}

func (service *TryoutResultService) BuildByTryoutID(ctx context.Context, tryoutID string) (model.TryoutResultResponse, error) {
	_, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	parsedTryoutID, err := uuid.Parse(tryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, exception.ValidationError{Message: "invalid tryout id"}
	}
	questions, err := service.QuestionRepository.FindByTryoutID(ctx, parsedTryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	sort.Slice(questions, func(i, j int) bool {
		return questions[i].LocalID < questions[j].LocalID
	})

	answers, err := service.UserAnswerRepository.FindByTryoutId(ctx, tryoutID)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	participantIDMap := map[string]struct{}{}
	participantIDs := make([]uuid.UUID, 0)
	for _, answer := range answers {
		userID := answer.UserID.String()
		if _, ok := participantIDMap[userID]; ok {
			continue
		}
		participantIDMap[userID] = struct{}{}
		participantIDs = append(participantIDs, answer.UserID)
	}

	users, err := service.UserRepository.FindByIDs(ctx, participantIDs)
	if err != nil {
		return model.TryoutResultResponse{}, err
	}

	userNameByID := map[string]string{}
	participants := make([]model.TryoutResultParticipant, 0, len(participantIDs))
	for _, user := range users {
		id := user.UserID.String()
		name := strings.TrimSpace(user.Name)
		if name == "" {
			name = user.Username
		}
		if name == "" {
			name = id
		}
		userNameByID[id] = name
	}

	participantIDsString := make([]string, 0, len(participantIDs))
	for _, participantID := range participantIDs {
		id := participantID.String()
		participantIDsString = append(participantIDsString, id)
		participants = append(participants, model.TryoutResultParticipant{
			UserID: id,
			Name:   userNameByID[id],
		})
	}

	sort.Slice(participants, func(i, j int) bool {
		return participants[i].Name < participants[j].Name
	})

	answerByQuestionAndUser := map[string]map[string]string{}
	for _, answer := range answers {
		questionID := answer.QuestionID.String()
		userID := answer.UserID.String()
		if _, ok := answerByQuestionAndUser[questionID]; !ok {
			answerByQuestionAndUser[questionID] = map[string]string{}
		}
		answerByQuestionAndUser[questionID][userID] = answer.UserAnswer
	}

	type subtestAccumulator struct {
		numeratorByUserID map[string]float64
		denominator       float64
	}

	subtestStats := map[string]*subtestAccumulator{}
	resultRows := make([]model.TryoutResultAnswerRow, 0, len(questions))

	for _, question := range questions {
		subtest := strings.ToLower(strings.TrimSpace(question.Type))
		if _, ok := subtestStats[subtest]; !ok {
			subtestStats[subtest] = &subtestAccumulator{
				numeratorByUserID: map[string]float64{},
				denominator:       0,
			}
		}

		markByUser := map[string]string{}
		correctCount := 0
		questionAnswers := answerByQuestionAndUser[question.QuestionID.String()]

		for _, participant := range participants {
			answerValue := questionAnswers[participant.UserID]
			if answerValue == "" {
				markByUser[participant.UserID] = "-"
				continue
			}
			if answerValue == question.CorrectAnswer {
				markByUser[participant.UserID] = "V"
				correctCount++
			} else {
				markByUser[participant.UserID] = "X"
			}
		}

		participantCount := len(participants)
		correctRatio := 0.0
		if participantCount > 0 {
			correctRatio = float64(correctCount) / float64(participantCount)
		}

		questionPoint := float64(question.Points)
		if questionPoint <= 0 {
			questionPoint = 1
		}

		// Approximate item difficulty weighting inspired by IRT behavior.
		questionWeight := questionPoint * (0.75 + (1 - correctRatio))
		subtestStats[subtest].denominator += questionWeight

		for _, participant := range participants {
			if markByUser[participant.UserID] == "V" {
				subtestStats[subtest].numeratorByUserID[participant.UserID] += questionWeight
			}
		}

		resultRows = append(resultRows, model.TryoutResultAnswerRow{
			QuestionID: question.QuestionID.String(),
			LocalID:    question.LocalID,
			Subtest:    subtest,
			Marks:      markByUser,
		})
	}

	subtests := make([]string, 0, len(subtestStats))
	for subtest := range subtestStats {
		subtests = append(subtests, subtest)
	}
	sort.Strings(subtests)

	scoreRows := make([]model.TryoutResultScoreRow, 0, len(subtests))
	summaryByUser := map[string]*model.TryoutResultUserSummary{}
	for _, participant := range participants {
		summaryByUser[participant.UserID] = &model.TryoutResultUserSummary{
			UserID:        participant.UserID,
			Name:          participant.Name,
			SubtestScores: map[string]int{},
			TotalScore:    0,
		}
	}

	for _, subtest := range subtests {
		stat := subtestStats[subtest]
		scores := map[string]int{}
		for _, participantID := range participantIDsString {
			scaledScore := int(minScaledScore)
			if stat.denominator > 0 {
				raw := stat.numeratorByUserID[participantID] / stat.denominator
				scaledScore = int(minScaledScore + raw*(maxScaledScore-minScaledScore) + 0.5)
			}
			scores[participantID] = scaledScore
			summaryByUser[participantID].SubtestScores[subtest] = scaledScore
			summaryByUser[participantID].TotalScore += scaledScore
		}

		scoreRows = append(scoreRows, model.TryoutResultScoreRow{
			Subtest: subtest,
			Scores:  scores,
		})
	}

	for _, participant := range participants {
		if item, ok := summaryByUser[participant.UserID]; ok {
			if len(item.SubtestScores) == 0 {
				item.AvgScore = 0
				continue
			}

			avg := float64(item.TotalScore) / float64(len(item.SubtestScores))
			item.AvgScore = math.Round(avg*100) / 100
		}
	}

	userSummary := make([]model.TryoutResultUserSummary, 0, len(summaryByUser))
	for _, participant := range participants {
		if item, ok := summaryByUser[participant.UserID]; ok {
			userSummary = append(userSummary, *item)
		}
	}

	return model.TryoutResultResponse{
		TryoutID:     tryoutID,
		GeneratedAt:  time.Now(),
		Participants: participants,
		ResultRows:   resultRows,
		ScoreRows:    scoreRows,
		UserSummary:  userSummary,
	}, nil
}
