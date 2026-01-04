package repository

import (
	"context"

	"github.com/artamananda/tryout-sample/internal/entity"
	"gorm.io/gorm"
)

type AIExampleRepository struct {
	DB *gorm.DB
}

func NewAIExampleRepository(db *gorm.DB) AIExampleRepository {
	return AIExampleRepository{DB: db}
}

func (repository *AIExampleRepository) Save(ctx context.Context, example entity.AIExample) error {
	return repository.DB.WithContext(ctx).Create(&example).Error
}

func (repository *AIExampleRepository) FindByTopic(ctx context.Context, topic string, limit int) ([]entity.AIExample, error) {
	var examples []entity.AIExample
	// Postgres uses RANDOM()
	err := repository.DB.WithContext(ctx).
		Where("topic ILIKE ?", "%"+topic+"%").
		Order("RANDOM()").
		Limit(limit).
		Find(&examples).Error
	return examples, err
}
