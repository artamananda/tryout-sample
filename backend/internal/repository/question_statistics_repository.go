package repository

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QuestionStatisticsRepository struct {
	*gorm.DB
}

func NewQuestionStatisticsRepository(db *gorm.DB) QuestionStatisticsRepository {
	return QuestionStatisticsRepository{DB: db}
}

func (repo *QuestionStatisticsRepository) Create(ctx context.Context, stats entity.QuestionStatistics) (entity.QuestionStatistics, error) {
	stats.StatID = uuid.New()
	err := repo.DB.WithContext(ctx).Create(&stats).Error
	if err != nil {
		return entity.QuestionStatistics{}, err
	}
	return stats, nil
}

func (repo *QuestionStatisticsRepository) FindByBankSoalID(ctx context.Context, bankSoalID uuid.UUID) (entity.QuestionStatistics, error) {
	var stats entity.QuestionStatistics
	err := repo.DB.WithContext(ctx).Where("bank_soal_id = ?", bankSoalID).First(&stats).Error
	if err != nil {
		return entity.QuestionStatistics{}, err
	}
	return stats, nil
}

func (repo *QuestionStatisticsRepository) Upsert(ctx context.Context, stats entity.QuestionStatistics) error {
	return repo.DB.WithContext(ctx).Save(&stats).Error
}

func (repo *QuestionStatisticsRepository) IncrementAttempt(ctx context.Context, bankSoalID uuid.UUID, isCorrect bool) error {
	updates := map[string]interface{}{
		"total_attempts": gorm.Expr("total_attempts + 1"),
		"last_updated":   gorm.Expr("NOW()"),
	}
	if isCorrect {
		updates["correct_attempts"] = gorm.Expr("correct_attempts + 1")
	}

	// Try to update existing record
	result := repo.DB.WithContext(ctx).Model(&entity.QuestionStatistics{}).Where("bank_soal_id = ?", bankSoalID).Updates(updates)
	if result.RowsAffected == 0 {
		// Create new record if not exists
		correctCount := 0
		if isCorrect {
			correctCount = 1
		}
		stats := entity.QuestionStatistics{
			BankSoalID:      bankSoalID,
			TotalAttempts:   1,
			CorrectAttempts: correctCount,
		}
		return repo.DB.WithContext(ctx).Create(&stats).Error
	}
	return result.Error
}

func (repo *QuestionStatisticsRepository) FindForRecalibration(ctx context.Context, minAttempts int) ([]entity.QuestionStatistics, error) {
	var stats []entity.QuestionStatistics
	err := repo.DB.WithContext(ctx).Where("total_attempts >= ?", minAttempts).Find(&stats).Error
	if err != nil {
		return nil, err
	}
	return stats, nil
}

func (repo *QuestionStatisticsRepository) UpdateCalculatedDifficulty(ctx context.Context, bankSoalID uuid.UUID, difficulty string) error {
	return repo.DB.WithContext(ctx).Model(&entity.QuestionStatistics{}).Where("bank_soal_id = ?", bankSoalID).Update("calculated_difficulty", difficulty).Error
}
