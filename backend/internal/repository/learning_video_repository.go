package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"gorm.io/gorm"
)

type LearningVideoWithProgramName struct {
	ID          int        `gorm:"column:id"`
	Title       string     `gorm:"column:title"`
	URL         string     `gorm:"column:url"`
	ProgramID   *string    `gorm:"column:program_id"`
	ProgramName *string    `gorm:"column:program_name"`
	CreatedAt   time.Time  `gorm:"column:created_at"`
	UpdatedAt   time.Time  `gorm:"column:updated_at"`
}

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

func (repository *LearningVideoRepository) FindAll(ctx context.Context, search string, programID *string, offset int, limit int, isAdmin bool) ([]entity.LearningVideo, int64, error) {
	var learningVideos []entity.LearningVideo
	var total int64

	query := repository.DB.WithContext(ctx)

	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	if programID != nil {
		query = query.Where("program_id = ?", *programID)
	} else if !isAdmin {
		// If user and no program_id, ensure empty result
		query = query.Where("1 = 0")
	}
	// If admin and no programID, return all videos (no where clause needed)

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

func (repository *LearningVideoRepository) FindAllWithProgramName(ctx context.Context, search string, programID *string, offset int, limit int, isAdmin bool) ([]LearningVideoWithProgramName, int64, error) {
	var learningVideos []LearningVideoWithProgramName
	var total int64

	query := repository.DB.WithContext(ctx).
		Select(
			"lv.id",
			"lv.title",
			"lv.url",
			"lv.program_id",
			"p.name as program_name",
			"lv.created_at",
			"lv.updated_at",
		).
		Table("learning_videos lv").
		Joins("LEFT JOIN programs p ON lv.program_id = p.program_id")

	if search != "" {
		query = query.Where("lv.title ILIKE ?", "%"+search+"%")
	}

	if programID != nil {
		query = query.Where("lv.program_id = ?", *programID)
	} else if !isAdmin {
		// If user and no program_id, ensure empty result
		query = query.Where("1 = 0")
	}
	// If admin and no programID, return all videos (no where clause needed)

	err := query.Session(&gorm.Session{}).Count(&total).Error
	if err != nil {
		return []LearningVideoWithProgramName{}, 0, err
	}

	err = query.Offset(offset).Limit(limit).Order("lv.created_at DESC").Scan(&learningVideos).Error
	if err != nil {
		return []LearningVideoWithProgramName{}, 0, err
	}

	return learningVideos, total, nil
}
