package service

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

// SKD subtests in the order BKN shows them, with their passing grades
// (ambang batas SKD CPNS umum). Adjust here if BKN changes them.
var SKDSubtests = []struct {
	Code         string
	Name         string
	PassingGrade int
}{
	{"twk", "Tes Wawasan Kebangsaan", 65},
	{"tiu", "Tes Intelegensia Umum", 80},
	{"tkp", "Tes Karakteristik Pribadi", 166},
}

const (
	skdPointsPerCorrect = 5
	skdMaxTKPPoints     = 5
	skdRankingCacheTTL  = 60 * time.Second
)

// ScoreSKDQuestion returns the points of one answer and whether it was right
// (right only applies to TWK/TIU).
func ScoreSKDQuestion(question entity.Question, answer string) (points int, correct bool) {
	answer = strings.TrimSpace(answer)
	if answer == "" {
		return 0, false
	}
	if strings.ToLower(strings.TrimSpace(question.Type)) != "tkp" {
		if answer == strings.TrimSpace(question.CorrectAnswer) {
			return skdPointsPerCorrect, true
		}
		return 0, false
	}

	index := -1
	for i, option := range question.Options {
		if strings.TrimSpace(option) == answer {
			index = i
			break
		}
	}
	if index < 0 {
		return 0, false
	}
	if len(question.OptionScores) == len(question.Options) {
		return int(question.OptionScores[index]), false
	}
	// No explicit weights: the generator writes the best option first (5)
	// down to the weakest (1).
	points = skdMaxTKPPoints - index
	if points < 1 {
		points = 1
	}
	return points, false
}

// SKDScore is the score of one participant.
type SKDScore struct {
	Subtests  []model.SKDSubtestScore
	ByCode    map[string]int
	Total     int
	MaxTotal  int
	PassedAll bool
	Weakest   string
}

// ScoreSKD scores a full set of answers (keyed by question id).
func ScoreSKD(questions []entity.Question, answers map[uuid.UUID]string) SKDScore {
	stats := map[string]*model.SKDSubtestScore{}
	for _, subtest := range SKDSubtests {
		stats[subtest.Code] = &model.SKDSubtestScore{
			Code:         subtest.Code,
			Name:         subtest.Name,
			PassingGrade: subtest.PassingGrade,
		}
	}

	for _, question := range questions {
		code := strings.ToLower(strings.TrimSpace(question.Type))
		stat, ok := stats[code]
		if !ok {
			continue
		}
		stat.Questions++
		if code == "tkp" {
			stat.MaxScore += skdMaxTKPPoints
		} else {
			stat.MaxScore += skdPointsPerCorrect
		}

		answer, answered := answers[question.QuestionID]
		if !answered || strings.TrimSpace(answer) == "" {
			continue
		}
		stat.Answered++
		points, correct := ScoreSKDQuestion(question, answer)
		stat.Score += points
		if code != "tkp" {
			if correct {
				stat.Correct++
			} else {
				stat.Wrong++
			}
		}
	}

	result := SKDScore{ByCode: map[string]int{}, PassedAll: true}
	weakestRatio := 0.0
	for _, subtest := range SKDSubtests {
		stat := stats[subtest.Code]
		stat.Passed = stat.Score >= stat.PassingGrade
		if !stat.Passed {
			result.PassedAll = false
		}
		result.Subtests = append(result.Subtests, *stat)
		result.ByCode[subtest.Code] = stat.Score
		result.Total += stat.Score
		result.MaxTotal += stat.MaxScore

		// Weakest subtest: furthest below (or least above) its passing grade.
		ratio := float64(stat.Score) / float64(stat.PassingGrade)
		if result.Weakest == "" || ratio < weakestRatio {
			result.Weakest = subtest.Code
			weakestRatio = ratio
		}
	}
	return result
}

// skdBetter orders participants like BKN: total, then TKP, TIU, TWK, then
// whoever finished first.
func skdBetter(a, b rankedParticipant) bool {
	if a.Score.Total != b.Score.Total {
		return a.Score.Total > b.Score.Total
	}
	for _, code := range []string{"tkp", "tiu", "twk"} {
		if a.Score.ByCode[code] != b.Score.ByCode[code] {
			return a.Score.ByCode[code] > b.Score.ByCode[code]
		}
	}
	return a.FinishedAt.Before(b.FinishedAt)
}

func skdTied(a, b rankedParticipant) bool {
	return a.Score.Total == b.Score.Total &&
		a.Score.ByCode["tkp"] == b.Score.ByCode["tkp"] &&
		a.Score.ByCode["tiu"] == b.Score.ByCode["tiu"] &&
		a.Score.ByCode["twk"] == b.Score.ByCode["twk"]
}

type rankedParticipant struct {
	UserID     uuid.UUID
	Name       string
	Phone      string
	Province   string
	Score      SKDScore
	FinishedAt time.Time
	Rank       int
}

type skdRanking struct {
	Tryout       entity.Tryout
	Participants []rankedParticipant
	GeneratedAt  time.Time
}

type SKDResultService struct {
	TryoutRepository            *repository.TryoutRepository
	QuestionRepository          *repository.QuestionRepository
	UserAnswerRepository        *repository.UserAnswerRepository
	TransactionTryoutRepository *repository.TransactionTryoutRepository
	UserRepository              *repository.UserRepository
	Now                         func() time.Time

	mu    sync.Mutex
	cache map[string]skdRanking
}

func NewSKDResultService(
	tryoutRepository *repository.TryoutRepository,
	questionRepository *repository.QuestionRepository,
	userAnswerRepository *repository.UserAnswerRepository,
	transactionTryoutRepository *repository.TransactionTryoutRepository,
	userRepository *repository.UserRepository,
) *SKDResultService {
	return &SKDResultService{
		TryoutRepository:            tryoutRepository,
		QuestionRepository:          questionRepository,
		UserAnswerRepository:        userAnswerRepository,
		TransactionTryoutRepository: transactionTryoutRepository,
		UserRepository:              userRepository,
		Now:                         time.Now,
		cache:                       map[string]skdRanking{},
	}
}

// Invalidate drops the cached ranking, e.g. after someone finishes.
func (service *SKDResultService) Invalidate(tryoutID string) {
	service.mu.Lock()
	delete(service.cache, tryoutID)
	service.mu.Unlock()
}

// finishedAt returns when a participant finished, or false if they have not.
// Running out of time counts as finished.
func finishedAt(transaction entity.TransactionTryout, duration int, now time.Time) (time.Time, bool) {
	if transaction.Status == TransactionTryoutCompleted {
		if !transaction.EndTime.IsZero() {
			return transaction.EndTime, true
		}
		return transaction.UpdatedAt, true
	}
	if transaction.Status == TransactionTryoutPaid && !transaction.StartTime.IsZero() {
		deadline := transaction.StartTime.Add(time.Duration(duration) * time.Minute)
		if now.After(deadline) {
			return deadline, true
		}
	}
	return time.Time{}, false
}

func (service *SKDResultService) ranking(ctx context.Context, tryoutID string) (skdRanking, error) {
	now := service.Now()
	service.mu.Lock()
	if cached, ok := service.cache[tryoutID]; ok && now.Sub(cached.GeneratedAt) < skdRankingCacheTTL {
		service.mu.Unlock()
		return cached, nil
	}
	service.mu.Unlock()

	id, err := parseID(tryoutID, "tryout_id")
	if err != nil {
		return skdRanking{}, err
	}
	tryout, err := service.TryoutRepository.FindById(ctx, tryoutID)
	if err != nil {
		return skdRanking{}, exception.NotFoundError{Message: "tryout Not Found"}
	}
	if tryout.ScoringMode != entity.ScoringModeSKD {
		return skdRanking{}, exception.BadRequestError{Message: "tryout ini tidak memakai penilaian SKD"}
	}

	questions, err := service.QuestionRepository.FindByTryoutID(ctx, id)
	if err != nil {
		return skdRanking{}, err
	}
	transactions, err := service.TransactionTryoutRepository.FindByTryoutId(ctx, tryoutID)
	if err != nil {
		return skdRanking{}, err
	}
	answers, err := service.UserAnswerRepository.FindByTryoutId(ctx, tryoutID)
	if err != nil {
		return skdRanking{}, err
	}

	answersByUser := map[uuid.UUID]map[uuid.UUID]string{}
	for _, answer := range answers {
		if answersByUser[answer.UserID] == nil {
			answersByUser[answer.UserID] = map[uuid.UUID]string{}
		}
		answersByUser[answer.UserID][answer.QuestionID] = answer.UserAnswer
	}

	participants := []rankedParticipant{}
	userIDs := []uuid.UUID{}
	seen := map[uuid.UUID]bool{}
	for _, transaction := range transactions {
		finished, ok := finishedAt(transaction, tryout.Duration, now)
		if !ok || seen[transaction.UserID] {
			continue
		}
		seen[transaction.UserID] = true
		userIDs = append(userIDs, transaction.UserID)
		participants = append(participants, rankedParticipant{
			UserID:     transaction.UserID,
			Score:      ScoreSKD(questions, answersByUser[transaction.UserID]),
			FinishedAt: finished,
		})
	}

	users, err := service.UserRepository.FindByIDs(ctx, userIDs)
	if err != nil {
		return skdRanking{}, err
	}
	userByID := map[uuid.UUID]entity.User{}
	for _, user := range users {
		userByID[user.UserID] = user
	}
	for i := range participants {
		user := userByID[participants[i].UserID]
		participants[i].Name = user.Name
		participants[i].Phone = user.PhoneNumber
		participants[i].Province = user.Province
	}

	sort.SliceStable(participants, func(i, j int) bool { return skdBetter(participants[i], participants[j]) })
	for i := range participants {
		if i > 0 && skdTied(participants[i], participants[i-1]) {
			participants[i].Rank = participants[i-1].Rank
		} else {
			participants[i].Rank = i + 1
		}
	}

	result := skdRanking{Tryout: tryout, Participants: participants, GeneratedAt: now}
	service.mu.Lock()
	service.cache[tryoutID] = result
	service.mu.Unlock()
	return result, nil
}

func (service *SKDResultService) isFinal(tryout entity.Tryout) bool {
	return !tryout.EndTime.IsZero() && service.Now().After(tryout.EndTime)
}

// MyResult returns the participant's SKD score and their national rank. The
// rank is provisional until the tryout closes.
func (service *SKDResultService) MyResult(ctx context.Context, tryoutID string, userID string) (model.SKDResultResponse, error) {
	ranking, err := service.ranking(ctx, tryoutID)
	if err != nil {
		return model.SKDResultResponse{}, err
	}

	var me *rankedParticipant
	for i := range ranking.Participants {
		if ranking.Participants[i].UserID.String() == userID {
			me = &ranking.Participants[i]
			break
		}
	}
	if me == nil {
		// The participant may have just finished; rebuild once before giving up.
		service.Invalidate(tryoutID)
		ranking, err = service.ranking(ctx, tryoutID)
		if err != nil {
			return model.SKDResultResponse{}, err
		}
		for i := range ranking.Participants {
			if ranking.Participants[i].UserID.String() == userID {
				me = &ranking.Participants[i]
				break
			}
		}
	}
	if me == nil {
		return model.SKDResultResponse{}, exception.NotFoundError{Message: "Selesaikan tryout untuk melihat skor dan peringkat."}
	}

	provinceRank, provinceTotal := 0, 0
	if me.Province != "" {
		for _, participant := range ranking.Participants {
			if participant.Province != me.Province {
				continue
			}
			provinceTotal++
			if participant.UserID == me.UserID {
				provinceRank = provinceTotal
			}
		}
	}

	return model.SKDResultResponse{
		TryoutID:       tryoutID,
		Title:          ranking.Tryout.Title,
		Subtests:       me.Score.Subtests,
		TotalScore:     me.Score.Total,
		MaxTotalScore:  me.Score.MaxTotal,
		PassedAll:      me.Score.PassedAll,
		WeakestSubtest: me.Score.Weakest,
		Rank:           me.Rank,
		Participants:   len(ranking.Participants),
		Province:       me.Province,
		ProvinceRank:   provinceRank,
		ProvinceTotal:  provinceTotal,
		IsFinal:        service.isFinal(ranking.Tryout),
		FinalAt:        ranking.Tryout.EndTime,
		GeneratedAt:    ranking.GeneratedAt,
	}, nil
}

// Ranking returns the full ranking for admins (with phone numbers for the
// WhatsApp follow-up described in the business plan).
func (service *SKDResultService) Ranking(ctx context.Context, tryoutID string) (model.SKDRankingResponse, error) {
	ranking, err := service.ranking(ctx, tryoutID)
	if err != nil {
		return model.SKDRankingResponse{}, err
	}
	rows := make([]model.SKDRankingRow, 0, len(ranking.Participants))
	for _, participant := range ranking.Participants {
		rows = append(rows, model.SKDRankingRow{
			Rank:        participant.Rank,
			UserID:      participant.UserID.String(),
			Name:        participant.Name,
			PhoneNumber: participant.Phone,
			Province:    participant.Province,
			Scores:      participant.Score.ByCode,
			TotalScore:  participant.Score.Total,
			PassedAll:   participant.Score.PassedAll,
			Weakest:     participant.Score.Weakest,
			FinishedAt:  participant.FinishedAt,
		})
	}
	return model.SKDRankingResponse{
		TryoutID:     tryoutID,
		Title:        ranking.Tryout.Title,
		IsFinal:      service.isFinal(ranking.Tryout),
		Participants: len(rows),
		Rows:         rows,
		GeneratedAt:  ranking.GeneratedAt,
	}, nil
}
