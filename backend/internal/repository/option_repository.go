package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OptionRepository struct {
	*gorm.DB
}

func NewOptionRepository(DB *gorm.DB) OptionRepository {
	return OptionRepository{DB: DB}
}

func (repository *OptionRepository) Create(ctx context.Context, option entity.Option) (entity.Option, error) {
	option.OptionID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&option).Error
	if err != nil {
		return entity.Option{}, err
	}
	return option, nil
}

func (repository *OptionRepository) Update(ctx context.Context, option entity.Option) (entity.Option, error) {
	err := repository.DB.WithContext(ctx).Where("option_id = ?", option.OptionID).Updates(&option).Error
	if err != nil {
		return entity.Option{}, err
	}
	return option, nil
}

func (repository *OptionRepository) Delete(ctx context.Context, optionID uuid.UUID) error {
	err := repository.DB.WithContext(ctx).Where("option_id = ?", optionID).Delete(&entity.Option{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (repository *OptionRepository) FindByID(ctx context.Context, optionID uuid.UUID) (entity.Option, error) {
	var option entity.Option
	result := repository.DB.WithContext(ctx).Unscoped().Where("option_id = ?", optionID).First(&option)
	if result.RowsAffected == 0 {
		return entity.Option{}, errors.New("option not found")
	}
	return option, nil
}

func (repository *OptionRepository) FindAllByQuestionID(ctx context.Context, questionID uuid.UUID) ([]entity.Option, error) {
	var options []entity.Option
	err := repository.DB.WithContext(ctx).Where("question_id = ?", questionID).Find(&options).Error
	if err != nil {
		return nil, err
	}
	return options, nil
}
