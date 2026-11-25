package service

import (
	"testing"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"github.com/stretchr/testify/assert"
)

func TestBuildSKDResult(t *testing.T) {
	twk := entity.Question{QuestionID: uuid.New(), LocalID: 1, Type: "twk", CorrectAnswer: "A", Options: pq.StringArray{"A", "B", "C", "D", "E"}}
	tiu := entity.Question{QuestionID: uuid.New(), LocalID: 2, Type: "tiu", CorrectAnswer: "C", Options: pq.StringArray{"A", "B", "C", "D", "E"}}
	tkp := entity.Question{QuestionID: uuid.New(), LocalID: 3, Type: "tkp", Options: pq.StringArray{"A", "B", "C", "D", "E"},
		OptionScores: pq.Int64Array{3, 5, 1, 2, 4}}
	questions := []entity.Question{twk, tiu, tkp}
	participants := []model.TryoutResultParticipant{{UserID: "u1", Name: "Ani"}, {UserID: "u2", Name: "Budi"}}
	answers := map[string]map[string]string{
		twk.QuestionID.String(): {"u1": "A", "u2": "B"},
		tiu.QuestionID.String(): {"u1": "C"},
		tkp.QuestionID.String(): {"u1": "B", "u2": "C"},
	}

	result := buildSKDResult("to-1", questions, participants, answers)

	assert.Equal(t, entity.ScoringModeSKD, result.ScoringMode)
	assert.Equal(t, map[string]int{"twk": 65, "tiu": 80, "tkp": 166}, result.PassingGrades)

	marks := map[string]map[string]string{}
	for _, row := range result.ResultRows {
		marks[row.Subtest] = row.Marks
	}
	assert.Equal(t, map[string]string{"u1": "V", "u2": "X"}, marks["twk"])
	assert.Equal(t, map[string]string{"u1": "V", "u2": "-"}, marks["tiu"], "unanswered is '-'")
	assert.Equal(t, map[string]string{"u1": "5", "u2": "1"}, marks["tkp"], "TKP shows the option weight")

	scores := map[string]map[string]int{}
	order := []string{}
	for _, row := range result.ScoreRows {
		scores[row.Subtest] = row.Scores
		order = append(order, row.Subtest)
	}
	assert.Equal(t, []string{"twk", "tiu", "tkp", "total"}, order)
	assert.Equal(t, map[string]int{"u1": 5, "u2": 0}, scores["twk"])
	assert.Equal(t, map[string]int{"u1": 5, "u2": 0}, scores["tiu"])
	assert.Equal(t, map[string]int{"u1": 5, "u2": 1}, scores["tkp"])
	assert.Equal(t, map[string]int{"u1": 15, "u2": 1}, scores["total"])
	assert.Equal(t, 15, result.UserSummary[0].TotalScore)
}
