package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"gorm.io/gorm"
)

type LearningVideoRepository struct {
	*gorm.DB
}

func NewLearningVideoRepository(DB *gorm.DB) LearningVideoRepository {
	return LearningVideoRepository{DB: DB}
}

func (repository *LearningVideoRepository) Create(ctx context.Context, learningVideo entity.LearningVideo) (entity.LearningVideo, error) {
	err := repository.DB.WithContext(ctx).Create(&learningVideo).Error
	if err != nil {
		return entity.LearningVideo{}, err
	}
	return learningVideo, nil
}

func (repository *LearningVideoRepository) FindByID(ctx context.Context, id int) (entity.LearningVideo, error) {
	var learningVideo entity.LearningVideo
	err := repository.DB.WithContext(ctx).Where("id = ?", id).First(&learningVideo).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return entity.LearningVideo{}, errors.New("learning video not found")
		}
		return entity.LearningVideo{}, err
	}
	return learningVideo, nil
}

func (repository *LearningVideoRepository) Update(ctx context.Context, learningVideo entity.LearningVideo) (entity.LearningVideo, error) {
	err := repository.DB.WithContext(ctx).Where("id = ?", learningVideo.ID).Updates(&learningVideo).Error
	if err != nil {
		return entity.LearningVideo{}, err
	}
	return learningVideo, nil
}

func (repository *LearningVideoRepository) Delete(ctx context.Context, id int) error {
	err := repository.DB.WithContext(ctx).Where("id = ?", id).Delete(&entity.LearningVideo{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (repository *LearningVideoRepository) FindAll(ctx context.Context, search string, programID *string, offset int, limit int) ([]entity.LearningVideo, int64, error) {
	var learningVideos []entity.LearningVideo
	var total int64

	query := repository.DB.WithContext(ctx)

	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	if programID != nil {
		query = query.Where("program_id = ?", *programID)
	} else {
		query = query.Where("program_id IS NULL")
	}

	err := query.Model(&entity.LearningVideo{}).Count(&total).Error
	if err != nil {
		return []entity.LearningVideo{}, 0, err
	}

	err = query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&learningVideos).Error
	if err != nil {
		return []entity.LearningVideo{}, 0, err
	}

	return learningVideos, total, nil
}
