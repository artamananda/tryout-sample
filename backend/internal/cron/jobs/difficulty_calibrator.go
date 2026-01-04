package jobs

import (
	"context"
	"fmt"
	"log"

	"github.com/artamananda/tryout-sample/internal/repository"
)

type DifficultyCalibrator struct {
	bankSoalRepo           *repository.BankSoalRepository
	questionStatisticsRepo *repository.QuestionStatisticsRepository
}

func NewDifficultyCalibrator(
	bankSoalRepo *repository.BankSoalRepository,
	questionStatisticsRepo *repository.QuestionStatisticsRepository,
) *DifficultyCalibrator {
	return &DifficultyCalibrator{
		bankSoalRepo:           bankSoalRepo,
		questionStatisticsRepo: questionStatisticsRepo,
	}
}

const MIN_ATTEMPTS_FOR_CALIBRATION = 10

func (j *DifficultyCalibrator) Run() error {
	ctx := context.Background()

	// Get questions with enough attempts for calibration
	stats, err := j.questionStatisticsRepo.FindForRecalibration(ctx, MIN_ATTEMPTS_FOR_CALIBRATION)
	if err != nil {
		return fmt.Errorf("failed to find statistics: %w", err)
	}

	if len(stats) == 0 {
		log.Println("[DifficultyCalibrator] No questions with enough attempts for calibration")
		return nil
	}

	log.Printf("[DifficultyCalibrator] Analyzing %d questions for recalibration", len(stats))

	calibrated := 0
	for _, stat := range stats {
		// Calculate accuracy rate
		if stat.TotalAttempts == 0 {
			continue
		}

		accuracy := float64(stat.CorrectAttempts) / float64(stat.TotalAttempts)
		newDifficulty := calculateDifficulty(accuracy)

		// Check if we need to update
		if stat.CalculatedDifficulty != newDifficulty {
			// Update statistics
			if err := j.questionStatisticsRepo.UpdateCalculatedDifficulty(ctx, stat.BankSoalID, newDifficulty); err != nil {
				log.Printf("[DifficultyCalibrator] Failed to update stat: %v", err)
				continue
			}

			// Update the actual question
			if err := j.bankSoalRepo.UpdateDifficulty(ctx, stat.BankSoalID, newDifficulty); err != nil {
				log.Printf("[DifficultyCalibrator] Failed to update question: %v", err)
				continue
			}

			log.Printf("[DifficultyCalibrator] Updated %s: accuracy=%.2f%% → %s",
				stat.BankSoalID, accuracy*100, newDifficulty)
			calibrated++
		}
	}

	log.Printf("[DifficultyCalibrator] Recalibrated %d questions", calibrated)
	return nil
}

func calculateDifficulty(accuracy float64) string {
	// If most people get it right → easy
	// If most people get it wrong → hard
	switch {
	case accuracy >= 0.70: // 70%+ correct
		return "easy"
	case accuracy >= 0.40: // 40-70% correct
		return "medium"
	default: // <40% correct
		return "hard"
	}
}
