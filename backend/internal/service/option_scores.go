package service

import (
	"fmt"

	"github.com/artamananda/tryout-sample/internal/exception"
	pq "github.com/lib/pq"
)

// normalizeOptionScores validates per-option weights (TKP 1-5). An empty list
// means "no explicit weights". When given, there must be one weight per option.
func normalizeOptionScores(scores []int, options []string) (pq.Int64Array, error) {
	if len(scores) == 0 {
		return nil, nil
	}
	if len(scores) != len(options) {
		return nil, exception.BadRequestError{Message: fmt.Sprintf("option_scores harus berisi %d nilai, satu per opsi", len(options))}
	}
	normalized := make(pq.Int64Array, 0, len(scores))
	for _, score := range scores {
		if score < 0 || score > 5 {
			return nil, exception.BadRequestError{Message: "setiap nilai option_scores harus 0 sampai 5"}
		}
		normalized = append(normalized, int64(score))
	}
	return normalized, nil
}

func toIntSlice(values pq.Int64Array) []int {
	if len(values) == 0 {
		return nil
	}
	result := make([]int, len(values))
	for i, value := range values {
		result[i] = int(value)
	}
	return result
}
