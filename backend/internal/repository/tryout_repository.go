package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TryoutRepository struct {
	*gorm.DB
}

func NewTryoutRepository(DB *gorm.DB) TryoutRepository {
	return TryoutRepository{DB: DB}
}

func (repository *TryoutRepository) Create(ctx context.Context, tryout entity.Tryout) entity.Tryout {
	tryout.TryoutID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&tryout).Error
	exception.PanicLogging(err)
	return tryout
}

func (repository *TryoutRepository) Update(ctx context.Context, tryout entity.Tryout) entity.Tryout {
	err := repository.DB.WithContext(ctx).Where("tryout_id = ?", tryout.TryoutID).Updates(&tryout).Error
	exception.PanicLogging(err)

	return tryout
}

func (repository *TryoutRepository) Delete(ctx context.Context, tryout entity.Tryout) {
	err := repository.DB.WithContext(ctx).Where("tryout_id = ?", tryout.TryoutID).Delete(&tryout).Error
	exception.PanicLogging(err)
}

func (repository *TryoutRepository) FindById(ctx context.Context, tryoutId string) (entity.Tryout, error) {
	var tryout entity.Tryout
	result := repository.DB.WithContext(ctx).Unscoped().Where("tryout_id = ?", tryoutId).First(&tryout)
	if result.RowsAffected == 0 {
		return entity.Tryout{}, errors.New("tryout Not Found")
	}
	return tryout, nil
}

func (repository *TryoutRepository) FindAll(ctx context.Context) []entity.Tryout {
	var tryouts []entity.Tryout
	repository.DB.WithContext(ctx).Find(&tryouts)
	return tryouts
}
