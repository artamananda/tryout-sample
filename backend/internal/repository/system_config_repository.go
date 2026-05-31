package repository

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type SystemConfigRepository struct {
	DB *gorm.DB
}

func NewSystemConfigRepository(db *gorm.DB) SystemConfigRepository {
	return SystemConfigRepository{DB: db}
}

func (r *SystemConfigRepository) FindAll(ctx context.Context) ([]entity.SystemConfig, error) {
	var configs []entity.SystemConfig
	result := r.DB.WithContext(ctx).Order("key ASC").Find(&configs)
	return configs, result.Error
}

func (r *SystemConfigRepository) FindByKey(ctx context.Context, key string) (entity.SystemConfig, error) {
	var config entity.SystemConfig
	result := r.DB.WithContext(ctx).Where("key = ?", key).First(&config)
	return config, result.Error
}

func (r *SystemConfigRepository) Upsert(ctx context.Context, key, value string) error {
	config := entity.SystemConfig{
		ID:    uuid.New(),
		Key:   key,
		Value: value,
	}
	result := r.DB.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "key"}},
			DoUpdates: clause.AssignmentColumns([]string{"value", "updated_at"}),
		}).
		Create(&config)
	return result.Error
}
