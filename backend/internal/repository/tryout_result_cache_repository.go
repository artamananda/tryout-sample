package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"gorm.io/gorm"
)

type TryoutResultCacheRepository struct {
	*gorm.DB
}

func NewTryoutResultCacheRepository(DB *gorm.DB) TryoutResultCacheRepository {
	return TryoutResultCacheRepository{DB: DB}
}

func (repository *TryoutResultCacheRepository) Upsert(ctx context.Context, data entity.TryoutResultCache) error {
	query := `
		INSERT INTO tryout_result_caches (tryout_id, payload, generated_at, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (tryout_id)
		DO UPDATE SET
			payload = EXCLUDED.payload,
			generated_at = EXCLUDED.generated_at,
			updated_at = NOW()
	`

	return repository.DB.WithContext(ctx).Exec(query, data.TryoutID, data.Payload, data.GeneratedAt).Error
}

func (repository *TryoutResultCacheRepository) FindByTryoutID(ctx context.Context, tryoutID string) (entity.TryoutResultCache, error) {
	var result entity.TryoutResultCache
	queryResult := repository.DB.WithContext(ctx).Where("tryout_id = ?", tryoutID).First(&result)
	if queryResult.RowsAffected == 0 {
		return entity.TryoutResultCache{}, errors.New("tryout result cache not found")
	}

	return result, nil
}
