package model

import "time"

type TryoutResultParticipant struct {
	UserID string `json:"user_id"`
	Name   string `json:"name"`
}

type TryoutResultAnswerRow struct {
	QuestionID string            `json:"question_id"`
	LocalID    int               `json:"local_id"`
	Subtest    string            `json:"subtest"`
	Marks      map[string]string `json:"marks"`
}

type TryoutResultScoreRow struct {
	Subtest string         `json:"subtest"`
	Scores  map[string]int `json:"scores"`
}

type TryoutResultUserSummary struct {
	UserID        string         `json:"user_id"`
	Name          string         `json:"name"`
	SubtestScores map[string]int `json:"subtest_scores"`
	TotalScore    int            `json:"total_score"`
	AvgScore      float64        `json:"avg_score"`
}

type TryoutUserResultResponse struct {
	TryoutID      string         `json:"tryout_id"`
	UserID        string         `json:"user_id"`
	Name          string         `json:"name"`
	GeneratedAt   time.Time      `json:"generated_at"`
	SubtestScores map[string]int `json:"subtest_scores"`
	TotalScore    int            `json:"total_score"`
	AvgScore      float64        `json:"avg_score"`
}

type TryoutResultResponse struct {
	TryoutID     string                    `json:"tryout_id"`
	GeneratedAt  time.Time                 `json:"generated_at"`
	Participants []TryoutResultParticipant `json:"participants"`
	ResultRows   []TryoutResultAnswerRow   `json:"result_rows"`
	ScoreRows    []TryoutResultScoreRow    `json:"score_rows"`
	UserSummary  []TryoutResultUserSummary `json:"user_summary"`
}
