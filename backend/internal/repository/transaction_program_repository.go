package repository

import (
	"context"
	"errors"
	"time"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionProgramRepository struct {
	*gorm.DB
}

func NewTransactionProgramRepository(DB *gorm.DB) TransactionProgramRepository {
	return TransactionProgramRepository{DB: DB}
}

func (repository *TransactionProgramRepository) Create(ctx context.Context, transactionProgram entity.TransactionProgram) entity.TransactionProgram {
	var transactionProgramResult entity.TransactionProgram
	result := repository.DB.WithContext(ctx).Unscoped().Where("program_id = ? AND user_id = ?", transactionProgram.ProgramID, transactionProgram.UserID).First(&transactionProgramResult)
	if result.RowsAffected == 0 {
		transactionProgram.TransactionProgramID = uuid.New()
		err := repository.DB.WithContext(ctx).Create(&transactionProgram).Error
		exception.PanicLogging(err)
	}

	return transactionProgram
}

func (repository *TransactionProgramRepository) Update(ctx context.Context, transactionProgram entity.TransactionProgram) entity.TransactionProgram {
	err := repository.DB.WithContext(ctx).Where("transaction_program_id = ?", transactionProgram.TransactionProgramID).Updates(&transactionProgram).Error
	exception.PanicLogging(err)

	return transactionProgram
}

func (repository *TransactionProgramRepository) Delete(ctx context.Context, transactionProgram entity.TransactionProgram) {
	err := repository.DB.WithContext(ctx).Where("transaction_program_id = ?", transactionProgram.TransactionProgramID).Delete(&transactionProgram).Error
	exception.PanicLogging(err)
}

func (repository *TransactionProgramRepository) FindById(ctx context.Context, transactionProgramId string) (entity.TransactionProgram, error) {
	var transactionProgram entity.TransactionProgram
	result := repository.DB.WithContext(ctx).Unscoped().Where("transaction_program_id = ?", transactionProgramId).Preload("User").Preload("Program").First(&transactionProgram)
	if result.RowsAffected == 0 {
		return entity.TransactionProgram{}, errors.New("transaction program Not Found")
	}
	return transactionProgram, nil
}

func (repository *TransactionProgramRepository) FindAll(ctx context.Context, params model.FindAllTransactionProgramsRequest) []entity.TransactionProgram {
	var transactionPrograms []entity.TransactionProgram
	query := repository.DB.WithContext(ctx)

	if params.Search != "" {
		query = query.Joins("JOIN users AS u ON u.user_id = transaction_programs.user_id").
			Where("u.name ILIKE ? OR u.school ILIKE ?", "%"+params.Search+"%", "%"+params.Search+"%")
	}

	if params.UserID != "" {
		query = query.Where("user_id = ?", params.UserID)
	}

	if params.ProgramID != "" {
		query = query.Where("program_id = ?", params.ProgramID)
	}

	query.Order("created_at DESC").Preload("User").Preload("Program").Find(&transactionPrograms)
	return transactionPrograms
}

func (repository *TransactionProgramRepository) HasPaidAccess(ctx context.Context, userID string, programID string) bool {
	var total int64
	repository.DB.WithContext(ctx).
		Model(&entity.TransactionProgram{}).
		// Self-registration stores COMPLETED, admin/payment flows store PAID; both grant access.
		Where("user_id = ? AND program_id = ? AND status IN ?", userID, programID, []string{"PAID", "COMPLETED"}).
		Count(&total)

	return total > 0
}

// ProgramAccess is the access a user has to one program, with the package held.
type ProgramAccess struct {
	ProgramID    uuid.UUID
	PackageID    *uuid.UUID
	BonusTryouts int
}

// FindAccessByUser returns the programs the user can access (paid or registered).
func (repository *TransactionProgramRepository) FindAccessByUser(ctx context.Context, userID string) ([]ProgramAccess, error) {
	var rows []ProgramAccess
	err := repository.DB.WithContext(ctx).
		Model(&entity.TransactionProgram{}).
		Select("program_id, package_id, bonus_tryouts").
		Where("user_id = ? AND status IN ?", userID, []string{"PAID", "COMPLETED"}).
		Scan(&rows).Error
	return rows, err
}

// GrantPackage gives the user access to the program with packageID, inside tx.
// An existing registration keeps its row; only the package changes.
func (repository *TransactionProgramRepository) GrantPackage(ctx context.Context, tx *gorm.DB, userID uuid.UUID, programID uuid.UUID, packageID uuid.UUID, invoiceNumber string) error {
	var existing entity.TransactionProgram
	result := tx.WithContext(ctx).
		Where("user_id = ? AND program_id = ?", userID, programID).
		Limit(1).Find(&existing)
	if result.Error != nil {
		return result.Error
	}

	now := time.Now()
	if result.RowsAffected == 0 {
		return tx.WithContext(ctx).Create(&entity.TransactionProgram{
			TransactionProgramID: uuid.New(),
			UserID:               userID,
			ProgramID:            programID,
			PackageID:            &packageID,
			InvoiceNumber:        invoiceNumber,
			Status:               "PAID",
			CreatedAt:            now,
			UpdatedAt:            now,
		}).Error
	}

	return tx.WithContext(ctx).Model(&entity.TransactionProgram{}).
		Where("transaction_program_id = ?", existing.TransactionProgramID).
		Updates(map[string]interface{}{
			"package_id": packageID,
			"status":     "PAID",
			"updated_at": now,
		}).Error
}

// AddBonusTryouts gives the user extra tryouts in a program (referral reward).
// It returns false when the user has no registration in that program.
func (repository *TransactionProgramRepository) AddBonusTryouts(ctx context.Context, tx *gorm.DB, userID uuid.UUID, programID uuid.UUID, count int) (bool, error) {
	result := tx.WithContext(ctx).Model(&entity.TransactionProgram{}).
		Where("user_id = ? AND program_id = ? AND status IN ?", userID, programID, []string{"PAID", "COMPLETED"}).
		Updates(map[string]interface{}{
			"bonus_tryouts": gorm.Expr("bonus_tryouts + ?", count),
			"updated_at":    time.Now(),
		})
	return result.RowsAffected > 0, result.Error
}

// FindProgramMembers lists every registration of a program (paid or registered).
func (repository *TransactionProgramRepository) FindProgramMembers(ctx context.Context, programID uuid.UUID) ([]entity.TransactionProgram, error) {
	var rows []entity.TransactionProgram
	err := repository.DB.WithContext(ctx).
		Where("program_id = ? AND status IN ?", programID, []string{"PAID", "COMPLETED"}).
		Preload("User").
		Find(&rows).Error
	return rows, err
}
