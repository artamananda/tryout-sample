package service

import (
	"testing"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	pq "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
)

func skdQuestion(questionType string, options []string, correct string, scores ...int64) entity.Question {
	return entity.Question{
		QuestionID:    uuid.New(),
		Type:          questionType,
		Options:       pq.StringArray(options),
		CorrectAnswer: correct,
		OptionScores:  pq.Int64Array(scores),
	}
}

func TestScoreSKDQuestion(t *testing.T) {
	twk := skdQuestion("twk", []string{"Pancasila", "UUD"}, "Pancasila")
	points, correct := ScoreSKDQuestion(twk, "Pancasila")
	assert.Equal(t, 5, points)
	assert.True(t, correct)
	points, correct = ScoreSKDQuestion(twk, "UUD")
	assert.Equal(t, 0, points)
	assert.False(t, correct)

	tkp := skdQuestion("tkp", []string{"a", "b", "c", "d", "e"}, "c", 2, 1, 5, 3, 4)
	points, _ = ScoreSKDQuestion(tkp, "c")
	assert.Equal(t, 5, points, "explicit weight")
	points, _ = ScoreSKDQuestion(tkp, "b")
	assert.Equal(t, 1, points)

	tkpNoWeights := skdQuestion("tkp", []string{"a", "b", "c", "d", "e"}, "a")
	points, _ = ScoreSKDQuestion(tkpNoWeights, "d")
	assert.Equal(t, 2, points, "positional fallback 5..1")

	points, _ = ScoreSKDQuestion(tkp, "")
	assert.Equal(t, 0, points, "empty answer scores 0")
}

func TestScoreSKDPassingGrades(t *testing.T) {
	questions := []entity.Question{}
	answers := map[uuid.UUID]string{}
	// 13 TWK correct = 65 (pass exactly), 15 TIU correct = 75 (fail), 34 TKP x5 = 170 (pass).
	for i := 0; i < 30; i++ {
		q := skdQuestion("twk", []string{"benar", "salah"}, "benar")
		questions = append(questions, q)
		if i < 13 {
			answers[q.QuestionID] = "benar"
		}
	}
	for i := 0; i < 35; i++ {
		q := skdQuestion("tiu", []string{"benar", "salah"}, "benar")
		questions = append(questions, q)
		if i < 15 {
			answers[q.QuestionID] = "benar"
		} else if i < 20 {
			answers[q.QuestionID] = "salah"
		}
	}
	for i := 0; i < 45; i++ {
		q := skdQuestion("tkp", []string{"a", "b", "c", "d", "e"}, "a", 5, 4, 3, 2, 1)
		questions = append(questions, q)
		if i < 34 {
			answers[q.QuestionID] = "a"
		}
	}

	score := ScoreSKD(questions, answers)
	assert.Equal(t, 65, score.ByCode["twk"])
	assert.Equal(t, 75, score.ByCode["tiu"])
	assert.Equal(t, 170, score.ByCode["tkp"])
	assert.Equal(t, 310, score.Total)
	assert.Equal(t, 550, score.MaxTotal, "110 SKD questions max out at 550")
	assert.False(t, score.PassedAll)
	assert.Equal(t, "tiu", score.Weakest)

	tiu := score.Subtests[1]
	assert.Equal(t, "tiu", tiu.Code)
	assert.False(t, tiu.Passed)
	assert.Equal(t, 15, tiu.Correct)
	assert.Equal(t, 5, tiu.Wrong)
	assert.Equal(t, 20, tiu.Answered)
	assert.True(t, score.Subtests[0].Passed, "65 meets the TWK passing grade")
}

func TestSKDRankingOrder(t *testing.T) {
	base := time.Now()
	mk := func(total, tkp, tiu, twk int, finished time.Duration) rankedParticipant {
		return rankedParticipant{
			UserID:     uuid.New(),
			Score:      SKDScore{Total: total, ByCode: map[string]int{"tkp": tkp, "tiu": tiu, "twk": twk}},
			FinishedAt: base.Add(finished),
		}
	}
	higherTotal := mk(400, 170, 130, 100, 0)
	tieMoreTKP := mk(390, 180, 110, 100, 0)
	tieLessTKP := mk(390, 170, 120, 100, 0)
	sameButSlower := mk(390, 170, 120, 100, time.Minute)

	assert.True(t, skdBetter(higherTotal, tieMoreTKP))
	assert.True(t, skdBetter(tieMoreTKP, tieLessTKP), "TKP breaks ties first, like BKN")
	assert.True(t, skdBetter(tieLessTKP, sameButSlower), "then the earlier finisher")
	assert.True(t, skdTied(tieLessTKP, sameButSlower), "identical scores share a rank")
}

func TestShuffleOptionsKeepsScoresAligned(t *testing.T) {
	options := []string{"terbaik", "baik", "cukup", "kurang", "buruk"}
	for i := 0; i < 20; i++ {
		shuffled, scores := shuffleOptions("tkp", options, nil)
		assert.ElementsMatch(t, options, []string(shuffled))
		for j, option := range shuffled {
			expected := map[string]int64{"terbaik": 5, "baik": 4, "cukup": 3, "kurang": 2, "buruk": 1}[option]
			assert.Equal(t, expected, scores[j], option)
		}
	}
	shuffled, scores := shuffleOptions("twk", []string{"a", "b"}, nil)
	assert.Len(t, shuffled, 2)
	assert.Nil(t, scores, "TWK has no weights")
}

func TestAccessEvaluate(t *testing.T) {
	service := NewAccessService(nil, nil)
	programID := uuid.New()
	premium := entity.Package{PackageID: uuid.New(), Name: "Premium", TryoutCount: 5}

	open := service.Evaluate(entity.Tryout{}, nil)
	assert.True(t, open.HasAccess, "tryouts outside programs stay open")

	notMember := service.Evaluate(entity.Tryout{ProgramID: &programID, Sequence: 1}, map[uuid.UUID]Membership{})
	assert.False(t, notMember.HasAccess)

	members := map[uuid.UUID]Membership{programID: {ProgramID: programID, Package: &premium}}
	assert.True(t, service.Evaluate(entity.Tryout{ProgramID: &programID, Sequence: 5}, members).HasAccess)
	locked := service.Evaluate(entity.Tryout{ProgramID: &programID, Sequence: 6}, members)
	assert.False(t, locked.HasAccess, "Premium covers TO 1-5 only")
	assert.Contains(t, locked.Reason, "TO 6")

	legacy := map[uuid.UUID]Membership{programID: {ProgramID: programID}}
	assert.True(t, service.Evaluate(entity.Tryout{ProgramID: &programID, Sequence: 10}, legacy).HasAccess, "registrations without a package keep full access")
}

func TestPackageCurrentPrice(t *testing.T) {
	now := time.Now()
	launch := 44900
	until := now.Add(time.Hour)
	pkg := entity.Package{Price: 50000, LaunchPrice: &launch, LaunchPriceUntil: &until}
	assert.Equal(t, 44900, pkg.CurrentPrice(now))
	assert.Equal(t, 50000, pkg.CurrentPrice(now.Add(2*time.Hour)), "normal price after the launch window")
	assert.True(t, entity.Package{}.IsFree(now))
}

func TestNormalizeOptionScores(t *testing.T) {
	scores, err := normalizeOptionScores([]int{5, 4, 3}, []string{"a", "b", "c"})
	assert.NoError(t, err)
	assert.Equal(t, pq.Int64Array{5, 4, 3}, scores)
	_, err = normalizeOptionScores([]int{5, 4}, []string{"a", "b", "c"})
	assert.Error(t, err, "one weight per option")
	_, err = normalizeOptionScores([]int{6, 4, 3}, []string{"a", "b", "c"})
	assert.Error(t, err, "weights are 0-5")
	scores, err = normalizeOptionScores(nil, []string{"a"})
	assert.NoError(t, err)
	assert.Nil(t, scores)
}
