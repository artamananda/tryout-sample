package jobs

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
)

type DripPublisher struct {
	bankSoalRepo *repository.BankSoalRepository
}

func NewDripPublisher(bankSoalRepo *repository.BankSoalRepository) *DripPublisher {
	return &DripPublisher{bankSoalRepo: bankSoalRepo}
}

const (
	MIN_PUBLISH_COUNT = 10
	MAX_PUBLISH_COUNT = 20
)

func (j *DripPublisher) Run() error {
	ctx := context.Background()

	// Get ready questions
	readyQuestions, err := j.bankSoalRepo.FindByStatus(ctx, entity.BankSoalStatusReady)
	if err != nil {
		return fmt.Errorf("failed to find ready questions: %w", err)
	}

	if len(readyQuestions) == 0 {
		log.Println("[DripPublisher] No ready questions to publish")
		return nil
	}

	// Determine how many to publish (10-20)
	publishCount := MIN_PUBLISH_COUNT
	if len(readyQuestions) < MIN_PUBLISH_COUNT {
		publishCount = len(readyQuestions)
	} else if len(readyQuestions) > MAX_PUBLISH_COUNT {
		publishCount = MAX_PUBLISH_COUNT
	}

	log.Printf("[DripPublisher] Publishing %d of %d ready questions", publishCount, len(readyQuestions))

	published := 0
	now := time.Now()
	for i := 0; i < publishCount && i < len(readyQuestions); i++ {
		q := readyQuestions[i]
		if err := j.bankSoalRepo.Publish(ctx, q.BankSoalID, now); err != nil {
			log.Printf("[DripPublisher] Failed to publish %s: %v", q.BankSoalID, err)
		} else {
			published++
		}
	}

	log.Printf("[DripPublisher] Successfully published %d questions", published)
	return nil
}
