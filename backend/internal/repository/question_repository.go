package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QuestionRepository struct {
	*gorm.DB
}

func NewQuestionRepository(DB *gorm.DB) QuestionRepository {
	return QuestionRepository{DB: DB}
}

func (repository *QuestionRepository) Create(ctx context.Context, question entity.Question) (entity.Question, error) {
	question.QuestionID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&question).Error
	if err != nil {
		return entity.Question{}, err
	}
	return question, nil
}

func (repository *QuestionRepository) Update(ctx context.Context, question entity.Question) (entity.Question, error) {
	err := repository.DB.WithContext(ctx).Where("question_id = ?", question.QuestionID).Updates(&question).Error
	if err != nil {
		return entity.Question{}, err
	}
	return question, nil
}

func (repository *QuestionRepository) Delete(ctx context.Context, questionID uuid.UUID) error {
	err := repository.DB.WithContext(ctx).Where("question_id = ?", questionID).Delete(&entity.Question{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (repository *QuestionRepository) FindByID(ctx context.Context, questionID uuid.UUID) (entity.Question, error) {
	var question entity.Question
	result := repository.DB.WithContext(ctx).Unscoped().Where("question_id = ?", questionID).First(&question)
	if result.RowsAffected == 0 {
		return entity.Question{}, errors.New("question not found")
	}
	return question, nil
}

func (repository *QuestionRepository) FindAll(ctx context.Context) ([]entity.Question, error) {
	var questions []entity.Question
	err := repository.DB.WithContext(ctx).Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}
