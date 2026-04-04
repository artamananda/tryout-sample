package repository

import (
	"context"
	"errors"

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
		Where("user_id = ? AND program_id = ? AND status = ?", userID, programID, "PAID").
		Count(&total)

	return total > 0
}
