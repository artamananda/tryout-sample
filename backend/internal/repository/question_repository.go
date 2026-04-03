package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/google/uuid"
	"github.com/lib/pq"
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

func (repository *QuestionRepository) CreateBatch(ctx context.Context, questions []entity.Question) ([]entity.Question, error) {
	for i := range questions {
		questions[i].QuestionID = uuid.New()
	}

	err := repository.DB.WithContext(ctx).Create(&questions).Error
	if err != nil {
		return nil, err
	}

	return questions, nil
}

func (repository *QuestionRepository) Update(ctx context.Context, question entity.Question) (entity.Question, error) {
	query := `
        UPDATE questions
        SET tryout_id = $1,
			bank_soal_id = $2,
			local_id = $3,
			type = $4,
			text = $5,
			image_url = $6,
			is_options = $7,
			options = $8,
			correct_answer = $9,
			points = $10,
			updated_at = $11
		WHERE question_id = $12
    `
	err := repository.DB.WithContext(ctx).Where("question_id = ?", question.QuestionID).Exec(query, question.TryoutID, question.BankSoalID, question.LocalID, question.Type, question.Text,
		question.ImageUrl, question.IsOptions, pq.Array(question.Options), question.CorrectAnswer,
		question.Points, question.UpdatedAt, question.QuestionID)
	if err.Error != nil {
		return entity.Question{}, err.Error
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

func (repository *QuestionRepository) FindByTryoutID(ctx context.Context, tryoutID uuid.UUID) ([]entity.Question, error) {
	var questions []entity.Question
	err := repository.DB.WithContext(ctx).Unscoped().Where("tryout_id = ?", tryoutID).Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (repository *QuestionRepository) FindAll(ctx context.Context) ([]entity.Question, error) {
	var questions []entity.Question
	err := repository.DB.WithContext(ctx).Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}
