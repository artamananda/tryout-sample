package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrLiveClassNotFound = errors.New("live class Not Found")

type LiveClassRepository struct {
	*gorm.DB
}

func NewLiveClassRepository(DB *gorm.DB) LiveClassRepository {
	return LiveClassRepository{DB: DB}
}

func (repository *LiveClassRepository) Create(ctx context.Context, class entity.LiveClass) (entity.LiveClass, error) {
	if class.ClassID == uuid.Nil {
		class.ClassID = uuid.New()
	}
	err := repository.DB.WithContext(ctx).Create(&class).Error
	return class, err
}

func (repository *LiveClassRepository) UpdateFields(ctx context.Context, classID uuid.UUID, fields map[string]interface{}) error {
	fields["updated_at"] = time.Now()
	return repository.DB.WithContext(ctx).Model(&entity.LiveClass{}).Where("class_id = ?", classID).Updates(fields).Error
}

func (repository *LiveClassRepository) Delete(ctx context.Context, classID uuid.UUID) error {
	return repository.DB.WithContext(ctx).Where("class_id = ?", classID).Delete(&entity.LiveClass{}).Error
}

func (repository *LiveClassRepository) FindByID(ctx context.Context, classID uuid.UUID) (entity.LiveClass, error) {
	var class entity.LiveClass
	result := repository.DB.WithContext(ctx).Where("class_id = ?", classID).Limit(1).Find(&class)
	if result.Error != nil {
		return entity.LiveClass{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.LiveClass{}, ErrLiveClassNotFound
	}
	return class, nil
}

func (repository *LiveClassRepository) FindByPrograms(ctx context.Context, programIDs []uuid.UUID) ([]entity.LiveClass, error) {
	var classes []entity.LiveClass
	if len(programIDs) == 0 {
		return classes, nil
	}
	err := repository.DB.WithContext(ctx).Where("program_id IN ?", programIDs).Order("starts_at ASC").Find(&classes).Error
	return classes, err
}

// RecordAttendance stores the first time a participant joined a class.
func (repository *LiveClassRepository) RecordAttendance(ctx context.Context, classID uuid.UUID, userID uuid.UUID, at time.Time) error {
	return repository.DB.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).
		Create(&entity.LiveClassAttendance{ClassID: classID, UserID: userID, JoinedAt: at}).Error
}

func (repository *LiveClassRepository) UpsertRating(ctx context.Context, rating entity.LiveClassRating) error {
	return repository.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "class_id"}, {Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"rating", "comment", "updated_at"}),
	}).Create(&rating).Error
}

// UserState returns which classes the user attended and the ratings they gave.
func (repository *LiveClassRepository) UserState(ctx context.Context, userID uuid.UUID, classIDs []uuid.UUID) (map[uuid.UUID]bool, map[uuid.UUID]int, error) {
	attended := map[uuid.UUID]bool{}
	ratings := map[uuid.UUID]int{}
	if len(classIDs) == 0 {
		return attended, ratings, nil
	}
	var attendances []entity.LiveClassAttendance
	if err := repository.DB.WithContext(ctx).Where("user_id = ? AND class_id IN ?", userID, classIDs).Find(&attendances).Error; err != nil {
		return nil, nil, err
	}
	for _, row := range attendances {
		attended[row.ClassID] = true
	}
	var rows []entity.LiveClassRating
	if err := repository.DB.WithContext(ctx).Where("user_id = ? AND class_id IN ?", userID, classIDs).Find(&rows).Error; err != nil {
		return nil, nil, err
	}
	for _, row := range rows {
		ratings[row.ClassID] = row.Rating
	}
	return attended, ratings, nil
}

// ClassStats is attendance and rating per class.
type ClassStats struct {
	ClassID     uuid.UUID
	Attendees   int
	RatingCount int
	RatingAvg   float64
}

func (repository *LiveClassRepository) Stats(ctx context.Context, classIDs []uuid.UUID) (map[uuid.UUID]ClassStats, error) {
	stats := map[uuid.UUID]ClassStats{}
	if len(classIDs) == 0 {
		return stats, nil
	}
	var attendance []struct {
		ClassID uuid.UUID
		Count   int
	}
	if err := repository.DB.WithContext(ctx).Model(&entity.LiveClassAttendance{}).
		Select("class_id, COUNT(*) AS count").Where("class_id IN ?", classIDs).Group("class_id").Scan(&attendance).Error; err != nil {
		return nil, err
	}
	for _, row := range attendance {
		item := stats[row.ClassID]
		item.ClassID = row.ClassID
		item.Attendees = row.Count
		stats[row.ClassID] = item
	}
	var ratings []struct {
		ClassID uuid.UUID
		Count   int
		Avg     float64
	}
	if err := repository.DB.WithContext(ctx).Model(&entity.LiveClassRating{}).
		Select("class_id, COUNT(*) AS count, AVG(rating)::float AS avg").Where("class_id IN ?", classIDs).Group("class_id").Scan(&ratings).Error; err != nil {
		return nil, err
	}
	for _, row := range ratings {
		item := stats[row.ClassID]
		item.ClassID = row.ClassID
		item.RatingCount = row.Count
		item.RatingAvg = row.Avg
		stats[row.ClassID] = item
	}
	return stats, nil
}
