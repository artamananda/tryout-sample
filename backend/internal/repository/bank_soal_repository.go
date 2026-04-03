package repository

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BankSoalRepository struct {
	*gorm.DB
}

var bankSoalOptionLabelPrefixPattern = regexp.MustCompile(`(?i)^[A-E]\.\s*`)

func NewBankSoalRepository(db *gorm.DB) BankSoalRepository {
	return BankSoalRepository{DB: db}
}

func (repository *BankSoalRepository) Create(ctx context.Context, bankSoal entity.BankSoal) (entity.BankSoal, error) {
	normalizeBankSoalForPersist(&bankSoal)
	bankSoal.BankSoalID = uuid.New()
	if bankSoal.Status == "" {
		bankSoal.Status = entity.BankSoalStatusDraft
	}
	err := repository.DB.WithContext(ctx).Create(&bankSoal).Error
	if err != nil {
		return entity.BankSoal{}, err
	}
	return bankSoal, nil
}

func (repository *BankSoalRepository) CreateBatch(ctx context.Context, bankSoals []entity.BankSoal) ([]entity.BankSoal, error) {
	for i := range bankSoals {
		normalizeBankSoalForPersist(&bankSoals[i])
		bankSoals[i].BankSoalID = uuid.New()
		if bankSoals[i].Status == "" {
			bankSoals[i].Status = entity.BankSoalStatusDraft
		}
	}
	err := repository.DB.WithContext(ctx).Create(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) FindByID(ctx context.Context, id uuid.UUID) (entity.BankSoal, error) {
	var bankSoal entity.BankSoal
	err := repository.DB.WithContext(ctx).Where("bank_soal_id = ?", id).First(&bankSoal).Error
	if err != nil {
		return entity.BankSoal{}, err
	}
	return bankSoal, nil
}

func (repository *BankSoalRepository) FindAll(ctx context.Context, includeUsed bool) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal
	query := repository.DB.WithContext(ctx).Order("created_at DESC")
	if !includeUsed {
		query = query.Where("NOT EXISTS (SELECT 1 FROM questions q WHERE q.bank_soal_id = bank_soals.bank_soal_id)")
	}
	err := query.Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) FindByType(ctx context.Context, questionType string, includeUsed bool) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal
	query := repository.DB.WithContext(ctx).Where("type = ?", questionType).Order("created_at DESC")
	if !includeUsed {
		query = query.Where("NOT EXISTS (SELECT 1 FROM questions q WHERE q.bank_soal_id = bank_soals.bank_soal_id)")
	}
	err := query.Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) FindPreview(ctx context.Context, questionType string, limit int, includeUsed bool) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal

	query := repository.DB.WithContext(ctx).Order("created_at DESC")
	if !includeUsed {
		query = query.Where("NOT EXISTS (SELECT 1 FROM questions q WHERE q.bank_soal_id = bank_soals.bank_soal_id)")
	}
	if questionType != "" {
		query = query.Where("type = ?", questionType)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}

	return bankSoals, nil
}

func (repository *BankSoalRepository) FindRandomAvailableByType(ctx context.Context, questionType string, limit int) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal

	query := repository.DB.WithContext(ctx).
		Where("type = ?", questionType).
		Where("NOT EXISTS (SELECT 1 FROM questions q WHERE q.bank_soal_id = bank_soals.bank_soal_id)").
		Order("RANDOM()")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}

	return bankSoals, nil
}

func (repository *BankSoalRepository) Update(ctx context.Context, bankSoal entity.BankSoal) (entity.BankSoal, error) {
	normalizeBankSoalForPersist(&bankSoal)
	err := repository.DB.WithContext(ctx).Save(&bankSoal).Error
	if err != nil {
		return entity.BankSoal{}, err
	}
	return bankSoal, nil
}

func normalizeBankSoalForPersist(bankSoal *entity.BankSoal) {
	normalizedOptions := normalizeBankSoalOptions(bankSoal.Options)
	bankSoal.Options = normalizedOptions
	bankSoal.CorrectAnswer = normalizeBankSoalCorrectAnswer(bankSoal.CorrectAnswer, normalizedOptions)
}

func normalizeBankSoalOptions(options []string) []string {
	normalized := make([]string, len(options))
	for i, option := range options {
		normalized[i] = normalizeBankSoalOptionText(option)
	}

	return normalized
}

func normalizeBankSoalCorrectAnswer(correctAnswer string, options []string) string {
	normalized := normalizeBankSoalOptionText(correctAnswer)
	if normalized == "" {
		return normalized
	}

	if len(options) == 0 {
		return normalized
	}

	if len(normalized) == 1 {
		optionIndex := int(strings.ToUpper(normalized)[0] - 'A')
		if optionIndex >= 0 && optionIndex < len(options) {
			return normalizeBankSoalOptionText(options[optionIndex])
		}
	}

	for _, option := range options {
		normalizedOption := normalizeBankSoalOptionText(option)
		if strings.EqualFold(normalizedOption, normalized) {
			return normalizedOption
		}
	}

	return normalized
}

func normalizeBankSoalOptionText(text string) string {
	trimmed := strings.TrimSpace(text)
	return bankSoalOptionLabelPrefixPattern.ReplaceAllString(trimmed, "")
}

func (repository *BankSoalRepository) Delete(ctx context.Context, id uuid.UUID) error {
	err := repository.DB.WithContext(ctx).Where("bank_soal_id = ?", id).Delete(&entity.BankSoal{}).Error
	if err != nil {
		return err
	}
	return nil
}

// ============== Cron Job Methods ==============

func (repository *BankSoalRepository) FindByStatus(ctx context.Context, status string) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal
	err := repository.DB.WithContext(ctx).Where("status = ?", status).Order("created_at ASC").Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) FindUnprocessedDrafts(ctx context.Context) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal
	err := repository.DB.WithContext(ctx).
		Where("status = ? AND processed_by_cron = ?", entity.BankSoalStatusDraft, false).
		Order("created_at ASC").
		Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	return repository.DB.WithContext(ctx).
		Model(&entity.BankSoal{}).
		Where("bank_soal_id = ?", id).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

func (repository *BankSoalRepository) MarkAsProcessed(ctx context.Context, id uuid.UUID) error {
	return repository.DB.WithContext(ctx).
		Model(&entity.BankSoal{}).
		Where("bank_soal_id = ?", id).
		Updates(map[string]interface{}{
			"processed_by_cron": true,
			"updated_at":        time.Now(),
		}).Error
}

func (repository *BankSoalRepository) MarkAsDuplicate(ctx context.Context, id uuid.UUID, similarToID *uuid.UUID, score float64) error {
	return repository.DB.WithContext(ctx).
		Model(&entity.BankSoal{}).
		Where("bank_soal_id = ?", id).
		Updates(map[string]interface{}{
			"status":           entity.BankSoalStatusDuplicate,
			"similar_to_id":    similarToID,
			"similarity_score": score,
			"updated_at":       time.Now(),
		}).Error
}

func (repository *BankSoalRepository) Publish(ctx context.Context, id uuid.UUID, publishTime time.Time) error {
	return repository.DB.WithContext(ctx).
		Model(&entity.BankSoal{}).
		Where("bank_soal_id = ?", id).
		Updates(map[string]interface{}{
			"status":       entity.BankSoalStatusPublished,
			"published_at": publishTime,
			"updated_at":   time.Now(),
		}).Error
}

func (repository *BankSoalRepository) UpdateDifficulty(ctx context.Context, id uuid.UUID, difficulty string) error {
	return repository.DB.WithContext(ctx).
		Model(&entity.BankSoal{}).
		Where("bank_soal_id = ?", id).
		Updates(map[string]interface{}{
			"difficulty": difficulty,
			"updated_at": time.Now(),
		}).Error
}

func (repository *BankSoalRepository) FindPublishedByDifficulty(ctx context.Context, difficulty string) ([]entity.BankSoal, error) {
	var bankSoals []entity.BankSoal
	err := repository.DB.WithContext(ctx).
		Where("status = ? AND difficulty = ?", entity.BankSoalStatusPublished, difficulty).
		Order("RANDOM()").
		Limit(20).
		Find(&bankSoals).Error
	if err != nil {
		return nil, err
	}
	return bankSoals, nil
}

func (repository *BankSoalRepository) FindPublished(ctx context.Context) ([]entity.BankSoal, error) {
	return repository.FindByStatus(ctx, entity.BankSoalStatusPublished)
}

func (repository *BankSoalRepository) GetUniqueTypes(ctx context.Context) ([]string, error) {
	var types []string
	err := repository.DB.WithContext(ctx).Model(&entity.BankSoal{}).Distinct("type").Pluck("type", &types).Error
	if err != nil {
		return nil, err
	}
	return types, nil
}
