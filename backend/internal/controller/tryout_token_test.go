package controller

import (
	"testing"
	"time"

	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/stretchr/testify/assert"
)

func TestTokenVisible(t *testing.T) {
	start := time.Date(2026, 11, 30, 8, 0, 0, 0, time.UTC)
	end := start.Add(24 * time.Hour)
	open := model.TryoutResponse{IsPublished: true, StartTime: start, EndTime: end, Token: "123456"}

	cases := []struct {
		name      string
		tryout    model.TryoutResponse
		hasAccess bool
		now       time.Time
		want      bool
	}{
		{"open and covered by package", open, true, start.Add(time.Hour), true},
		{"exactly at start", open, true, start, true},
		{"not in package", open, false, start.Add(time.Hour), false},
		{"before start", open, true, start.Add(-time.Minute), false},
		{"at end", open, true, end, false},
		{"after end", open, true, end.Add(time.Hour), false},
		{"unpublished", model.TryoutResponse{StartTime: start, EndTime: end}, true, start.Add(time.Hour), false},
		{"no schedule", model.TryoutResponse{IsPublished: true}, true, start, false},
	}
	for _, c := range cases {
		assert.Equal(t, c.want, tokenVisible(c.tryout, c.hasAccess, c.now), c.name)
	}
}
