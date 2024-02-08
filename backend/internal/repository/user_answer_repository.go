package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserAnswerRepository struct {
	*gorm.DB
}

func NewUserAnswerRepository(DB *gorm.DB) UserAnswerRepository {
	return UserAnswerRepository{DB: DB}
}

func (repository *UserAnswerRepository) Create(ctx context.Context, user_answer entity.UserAnswer) entity.UserAnswer {
	user_answer.UserAnswerID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&user_answer).Error
	exception.PanicLogging(err)
	return user_answer
}

func (repository *UserAnswerRepository) Update(ctx context.Context, user_answer entity.UserAnswer) entity.UserAnswer {
	err := repository.DB.WithContext(ctx).Where("user_answer_id = ?", user_answer.UserAnswerID).Updates(&user_answer).Error
	exception.PanicLogging(err)

	return user_answer
}

func (repository *UserAnswerRepository) Delete(ctx context.Context, user_answer entity.UserAnswer) {
	err := repository.DB.WithContext(ctx).Where("user_answer_id = ?", user_answer.UserAnswerID).Delete(&user_answer).Error
	exception.PanicLogging(err)
}

func (repository *UserAnswerRepository) FindById(ctx context.Context, user_answer_id string) (entity.UserAnswer, error) {
	var user_answer entity.UserAnswer
	result := repository.DB.WithContext(ctx).Unscoped().Where("user_answer_id = ?", user_answer_id).First(&user_answer)
	if result.RowsAffected == 0 {
		return entity.UserAnswer{}, errors.New("user_answer Not Found")
	}
	return user_answer, nil
}

func (repository *UserAnswerRepository) FindAll(ctx context.Context) []entity.UserAnswer {
	var user_answers []entity.UserAnswer
	repository.DB.WithContext(ctx).Find(&user_answers)
	return user_answers
}
