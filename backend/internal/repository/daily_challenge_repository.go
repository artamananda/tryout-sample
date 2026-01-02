package repository

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DailyChallengeRepository struct {
	*gorm.DB
}

func NewDailyChallengeRepository(db *gorm.DB) DailyChallengeRepository {
	return DailyChallengeRepository{DB: db}
}

func (repo *DailyChallengeRepository) Create(ctx context.Context, challenge entity.DailyChallenge) (entity.DailyChallenge, error) {
	challenge.ChallengeID = uuid.New()
	err := repo.DB.WithContext(ctx).Create(&challenge).Error
	if err != nil {
		return entity.DailyChallenge{}, err
	}
	return challenge, nil
}

func (repo *DailyChallengeRepository) FindByDate(ctx context.Context, date time.Time) (entity.DailyChallenge, error) {
	var challenge entity.DailyChallenge
	err := repo.DB.WithContext(ctx).Where("challenge_date = ?", date.Format("2006-01-02")).First(&challenge).Error
	if err != nil {
		return entity.DailyChallenge{}, err
	}
	return challenge, nil
}

func (repo *DailyChallengeRepository) FindToday(ctx context.Context) (entity.DailyChallenge, error) {
	return repo.FindByDate(ctx, time.Now())
}

func (repo *DailyChallengeRepository) FindActive(ctx context.Context) ([]entity.DailyChallenge, error) {
	var challenges []entity.DailyChallenge
	err := repo.DB.WithContext(ctx).Where("status = ?", "active").Order("challenge_date DESC").Find(&challenges).Error
	if err != nil {
		return nil, err
	}
	return challenges, nil
}

func (repo *DailyChallengeRepository) ExistsForDate(ctx context.Context, date time.Time) (bool, error) {
	var count int64
	err := repo.DB.WithContext(ctx).Model(&entity.DailyChallenge{}).Where("challenge_date = ?", date.Format("2006-01-02")).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
