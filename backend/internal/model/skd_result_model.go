package model

import "time"

type SKDSubtestScore struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	Score        int    `json:"score"`
	MaxScore     int    `json:"max_score"`
	PassingGrade int    `json:"passing_grade"`
	Passed       bool   `json:"passed"`
	Questions    int    `json:"questions"`
	Answered     int    `json:"answered"`
	// Correct and Wrong are only meaningful for TWK and TIU.
	Correct int `json:"correct"`
	Wrong   int `json:"wrong"`
}

type SKDResultResponse struct {
	TryoutID       string            `json:"tryout_id"`
	Title          string            `json:"title"`
	Subtests       []SKDSubtestScore `json:"subtests"`
	TotalScore     int               `json:"total_score"`
	MaxTotalScore  int               `json:"max_total_score"`
	PassedAll      bool              `json:"passed_all"`
	WeakestSubtest string            `json:"weakest_subtest"`
	Rank           int               `json:"rank"`
	Participants   int               `json:"participants"`
	Province       string            `json:"province"`
	ProvinceRank   int               `json:"province_rank"`
	ProvinceTotal  int               `json:"province_participants"`
	// IsFinal is false while the tryout is still open: the rank can change.
	IsFinal     bool      `json:"is_final"`
	FinalAt     time.Time `json:"final_at"`
	GeneratedAt time.Time `json:"generated_at"`
}

type SKDRankingRow struct {
	Rank        int            `json:"rank"`
	UserID      string         `json:"user_id"`
	Name        string         `json:"name"`
	PhoneNumber string         `json:"phone_number,omitempty"`
	Province    string         `json:"province"`
	Scores      map[string]int `json:"scores"`
	TotalScore  int            `json:"total_score"`
	PassedAll   bool           `json:"passed_all"`
	Weakest     string         `json:"weakest_subtest"`
	FinishedAt  time.Time      `json:"finished_at"`
}

type SKDRankingResponse struct {
	TryoutID     string          `json:"tryout_id"`
	Title        string          `json:"title"`
	IsFinal      bool            `json:"is_final"`
	Participants int             `json:"participants"`
	Rows         []SKDRankingRow `json:"rows"`
	GeneratedAt  time.Time       `json:"generated_at"`
}

// SKDTryoutProgress is one TO of a participant's progress in a program.
type SKDTryoutProgress struct {
	TryoutID     string         `json:"tryout_id"`
	Sequence     int            `json:"sequence"`
	Title        string         `json:"title"`
	Completed    bool           `json:"completed"`
	TotalScore   int            `json:"total_score"`
	Scores       map[string]int `json:"scores,omitempty"`
	PassedAll    bool           `json:"passed_all"`
	Weakest      string         `json:"weakest_subtest,omitempty"`
	Rank         int            `json:"rank,omitempty"`
	Participants int            `json:"participants,omitempty"`
	FinishedAt   *time.Time     `json:"finished_at,omitempty"`
	StartTime    time.Time      `json:"start_time"`
	EndTime      time.Time      `json:"end_time"`
}
