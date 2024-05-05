package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionTryoutRepository struct {
	*gorm.DB
}

func NewTransactionTryoutRepository(DB *gorm.DB) TransactionTryoutRepository {
	return TransactionTryoutRepository{DB: DB}
}

func (repository *TransactionTryoutRepository) Create(ctx context.Context, transactionTryout entity.TransactionTryout) entity.TransactionTryout {
	transactionTryout.TransactionTryoutID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&transactionTryout).Error
	exception.PanicLogging(err)

	return transactionTryout
}

func (repository *TransactionTryoutRepository) Update(ctx context.Context, transactionTryout entity.TransactionTryout) entity.TransactionTryout {
	err := repository.DB.WithContext(ctx).Where("transaction_tryout_id = ?", transactionTryout.TransactionTryoutID).Updates(&transactionTryout).Error
	exception.PanicLogging(err)

	return transactionTryout
}

func (repository *TransactionTryoutRepository) Delete(ctx context.Context, transactionTryout entity.TransactionTryout) {
	err := repository.DB.WithContext(ctx).Where("transaction_tryout_id = ?", transactionTryout.TransactionTryoutID).Delete(&transactionTryout).Error
	exception.PanicLogging(err)
}

func (repository *TransactionTryoutRepository) FindById(ctx context.Context, transactionTryoutId string) (entity.TransactionTryout, error) {
	var transactionTryout entity.TransactionTryout
	result := repository.DB.WithContext(ctx).Unscoped().Where("transaction_tryout_id = ?", transactionTryoutId).First(&transactionTryout)
	if result.RowsAffected == 0 {
		return entity.TransactionTryout{}, errors.New("transaction tryout Not Found")
	}
	return transactionTryout, nil
}

func (repository *TransactionTryoutRepository) FindAll(ctx context.Context) []entity.TransactionTryout {
	var transactionTryouts []entity.TransactionTryout
	repository.DB.WithContext(ctx).Find(&transactionTryouts)
	return transactionTryouts
}
