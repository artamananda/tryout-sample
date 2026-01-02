package jobs

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
	pq "github.com/lib/pq"
)

type ChallengeGenerator struct {
	bankSoalRepo       *repository.BankSoalRepository
	dailyChallengeRepo *repository.DailyChallengeRepository
}

func NewChallengeGenerator(
	bankSoalRepo *repository.BankSoalRepository,
	dailyChallengeRepo *repository.DailyChallengeRepository,
) *ChallengeGenerator {
	return &ChallengeGenerator{
		bankSoalRepo:       bankSoalRepo,
		dailyChallengeRepo: dailyChallengeRepo,
	}
}

func (j *ChallengeGenerator) Run() error {
	ctx := context.Background()
	today := time.Now()

	// Check if today's challenge already exists
	exists, err := j.dailyChallengeRepo.ExistsForDate(ctx, today)
	if err != nil {
		return fmt.Errorf("failed to check existing challenge: %w", err)
	}

	if exists {
		log.Println("[ChallengeGenerator] Today's challenge already exists")
		return nil
	}

	// Get published questions by difficulty
	easyQuestions, err := j.bankSoalRepo.FindPublishedByDifficulty(ctx, "easy")
	if err != nil {
		log.Printf("[ChallengeGenerator] Failed to find easy questions: %v", err)
		easyQuestions = []entity.BankSoal{}
	}

	mediumQuestions, err := j.bankSoalRepo.FindPublishedByDifficulty(ctx, "medium")
	if err != nil {
		log.Printf("[ChallengeGenerator] Failed to find medium questions: %v", err)
		mediumQuestions = []entity.BankSoal{}
	}

	hardQuestions, err := j.bankSoalRepo.FindPublishedByDifficulty(ctx, "hard")
	if err != nil {
		log.Printf("[ChallengeGenerator] Failed to find hard questions: %v", err)
		hardQuestions = []entity.BankSoal{}
	}

	// Select: 2 easy, 2 medium, 1 hard
	selectedIDs := make([]string, 0, 5)

	selectedIDs = append(selectedIDs, selectRandom(easyQuestions, 2)...)
	selectedIDs = append(selectedIDs, selectRandom(mediumQuestions, 2)...)
	selectedIDs = append(selectedIDs, selectRandom(hardQuestions, 1)...)

	if len(selectedIDs) < 3 {
		log.Println("[ChallengeGenerator] Not enough questions to create challenge")
		return nil
	}

	// Create daily challenge
	challenge := entity.DailyChallenge{
		ChallengeID:   uuid.New(),
		ChallengeDate: today,
		QuestionIDs:   pq.StringArray(selectedIDs),
		Title:         fmt.Sprintf("Tantangan Harian - %s", today.Format("2 January 2006")),
		Description:   "Selesaikan 5 soal ini untuk mendapatkan poin bonus!",
		BonusPoints:   10,
		Status:        "active",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	if _, err := j.dailyChallengeRepo.Create(ctx, challenge); err != nil {
		return fmt.Errorf("failed to create daily challenge: %w", err)
	}

	log.Printf("[ChallengeGenerator] Created daily challenge with %d questions", len(selectedIDs))
	return nil
}

func selectRandom(questions []entity.BankSoal, count int) []string {
	if len(questions) == 0 {
		return []string{}
	}

	if len(questions) <= count {
		result := make([]string, len(questions))
		for i, q := range questions {
			result[i] = q.BankSoalID.String()
		}
		return result
	}

	// Shuffle and select
	rand.Shuffle(len(questions), func(i, j int) {
		questions[i], questions[j] = questions[j], questions[i]
	})

	result := make([]string, count)
	for i := 0; i < count; i++ {
		result[i] = questions[i].BankSoalID.String()
	}
	return result
}
