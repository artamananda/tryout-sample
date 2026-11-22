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

var ErrSlotNotFound = errors.New("mentoring slot Not Found")

// Slot statuses that use up one of the participant's sessions.
var UsedSlotStatuses = []string{entity.SlotBooked, entity.SlotDone, entity.SlotNoShow}

type MentoringRepository struct {
	*gorm.DB
}

func NewMentoringRepository(DB *gorm.DB) MentoringRepository {
	return MentoringRepository{DB: DB}
}

// CreateMany inserts slots and skips the ones that already exist (same tutor
// and start time). It returns how many were created.
func (repository *MentoringRepository) CreateMany(ctx context.Context, slots []entity.MentoringSlot) (int64, error) {
	if len(slots) == 0 {
		return 0, nil
	}
	result := repository.DB.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&slots)
	return result.RowsAffected, result.Error
}

func (repository *MentoringRepository) FindByID(ctx context.Context, slotID uuid.UUID) (entity.MentoringSlot, error) {
	var slot entity.MentoringSlot
	result := repository.DB.WithContext(ctx).Where("slot_id = ?", slotID).Limit(1).Find(&slot)
	if result.Error != nil {
		return entity.MentoringSlot{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.MentoringSlot{}, ErrSlotNotFound
	}
	return slot, nil
}

func (repository *MentoringRepository) LockByID(ctx context.Context, tx *gorm.DB, slotID uuid.UUID) (entity.MentoringSlot, error) {
	var slot entity.MentoringSlot
	result := tx.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).Where("slot_id = ?", slotID).Limit(1).Find(&slot)
	if result.Error != nil {
		return entity.MentoringSlot{}, result.Error
	}
	if result.RowsAffected == 0 {
		return entity.MentoringSlot{}, ErrSlotNotFound
	}
	return slot, nil
}

func (repository *MentoringRepository) UpdateFields(ctx context.Context, tx *gorm.DB, slotID uuid.UUID, fields map[string]interface{}) error {
	fields["updated_at"] = time.Now()
	return tx.WithContext(ctx).Model(&entity.MentoringSlot{}).Where("slot_id = ?", slotID).Updates(fields).Error
}

func (repository *MentoringRepository) Delete(ctx context.Context, slotID uuid.UUID) error {
	return repository.DB.WithContext(ctx).Where("slot_id = ?", slotID).Delete(&entity.MentoringSlot{}).Error
}

// CountUsed counts the sessions a user has used in a program.
func (repository *MentoringRepository) CountUsed(ctx context.Context, tx *gorm.DB, userID uuid.UUID, programID uuid.UUID) (int64, error) {
	var count int64
	err := tx.WithContext(ctx).Model(&entity.MentoringSlot{}).
		Where("booked_by = ? AND program_id = ? AND status IN ?", userID, programID, UsedSlotStatuses).
		Count(&count).Error
	return count, err
}

// FindForParticipant lists open future slots plus the user's own slots.
func (repository *MentoringRepository) FindForParticipant(ctx context.Context, programID uuid.UUID, userID uuid.UUID, now time.Time) ([]entity.MentoringSlot, error) {
	var slots []entity.MentoringSlot
	err := repository.DB.WithContext(ctx).
		Where("program_id = ? AND ((status = ? AND starts_at > ?) OR booked_by = ?)", programID, entity.SlotOpen, now, userID).
		Order("starts_at ASC, tutor_name ASC").
		Find(&slots).Error
	return slots, err
}

func (repository *MentoringRepository) FindByProgram(ctx context.Context, programID uuid.UUID) ([]entity.MentoringSlot, error) {
	var slots []entity.MentoringSlot
	err := repository.DB.WithContext(ctx).Where("program_id = ?", programID).Order("starts_at ASC, tutor_name ASC").Find(&slots).Error
	return slots, err
}
