package jobs

import (
	"context"
	"fmt"
	"log"
	"strings"
	"unicode"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type Deduplicator struct {
	bankSoalRepo *repository.BankSoalRepository
}

func NewDeduplicator(bankSoalRepo *repository.BankSoalRepository) *Deduplicator {
	return &Deduplicator{bankSoalRepo: bankSoalRepo}
}

func (j *Deduplicator) Run() error {
	ctx := context.Background()

	// Get all draft questions
	drafts, err := j.bankSoalRepo.FindByStatus(ctx, entity.BankSoalStatusDraft)
	if err != nil {
		return fmt.Errorf("failed to find draft questions: %w", err)
	}

	if len(drafts) == 0 {
		log.Println("[Deduplicator] No draft questions to check")
		return nil
	}

	// Get all published questions for comparison
	published, err := j.bankSoalRepo.FindByStatus(ctx, entity.BankSoalStatusPublished)
	if err != nil {
		return fmt.Errorf("failed to find published questions: %w", err)
	}

	// Also include ready questions
	ready, err := j.bankSoalRepo.FindByStatus(ctx, entity.BankSoalStatusReady)
	if err != nil {
		return fmt.Errorf("failed to find ready questions: %w", err)
	}

	existingQuestions := append(published, ready...)
	log.Printf("[Deduplicator] Checking %d drafts against %d existing questions", len(drafts), len(existingQuestions))

	duplicatesFound := 0
	for _, draft := range drafts {
		isDuplicate, similarTo, score := j.checkDuplicate(draft, existingQuestions)

		if isDuplicate {
			duplicatesFound++
			if err := j.bankSoalRepo.MarkAsDuplicate(ctx, draft.BankSoalID, similarTo, score); err != nil {
				log.Printf("[Deduplicator] Failed to mark duplicate: %v", err)
			} else {
				log.Printf("[Deduplicator] Marked %s as duplicate (%.2f%% similar to %s)",
					draft.BankSoalID, score*100, similarTo)
			}
		} else {
			// Mark as ready if not duplicate
			if err := j.bankSoalRepo.UpdateStatus(ctx, draft.BankSoalID, entity.BankSoalStatusReady); err != nil {
				log.Printf("[Deduplicator] Failed to update status: %v", err)
			}
		}
	}

	log.Printf("[Deduplicator] Found %d duplicates out of %d drafts", duplicatesFound, len(drafts))
	return nil
}

func (j *Deduplicator) checkDuplicate(draft entity.BankSoal, existing []entity.BankSoal) (bool, *uuid.UUID, float64) {
	const SIMILARITY_THRESHOLD = 0.90 // 90%

	draftText := normalizeText(draft.Text)

	for _, q := range existing {
		existingText := normalizeText(q.Text)
		similarity := calculateSimilarity(draftText, existingText)

		if similarity >= SIMILARITY_THRESHOLD {
			return true, &q.BankSoalID, similarity
		}
	}

	return false, nil, 0
}

func normalizeText(text string) string {
	var result strings.Builder
	for _, r := range text {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			result.WriteRune(unicode.ToLower(r))
		} else if unicode.IsSpace(r) {
			result.WriteRune(' ')
		}
	}
	return strings.TrimSpace(result.String())
}

func calculateSimilarity(s1, s2 string) float64 {
	if s1 == s2 {
		return 1.0
	}

	if len(s1) == 0 || len(s2) == 0 {
		return 0.0
	}

	words1 := strings.Fields(s1)
	words2 := strings.Fields(s2)

	if len(words1) == 0 || len(words2) == 0 {
		return 0.0
	}

	wordSet1 := make(map[string]bool)
	for _, w := range words1 {
		wordSet1[w] = true
	}

	commonCount := 0
	for _, w := range words2 {
		if wordSet1[w] {
			commonCount++
		}
	}

	totalUnique := len(wordSet1)
	for _, w := range words2 {
		if !wordSet1[w] {
			totalUnique++
		}
	}

	if totalUnique == 0 {
		return 0.0
	}

	return float64(commonCount) / float64(totalUnique)
}
