package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProgramRepository struct {
	*gorm.DB
}

func NewProgramRepository(DB *gorm.DB) ProgramRepository {
	return ProgramRepository{DB: DB}
}

func (repository *ProgramRepository) Create(ctx context.Context, program entity.Program) (entity.Program, error) {
	program.ProgramID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&program).Error
	if err != nil {
		return entity.Program{}, err
	}
	return program, nil
}

func (repository *ProgramRepository) Update(ctx context.Context, program entity.Program) (entity.Program, error) {
	err := repository.DB.WithContext(ctx).Where("program_id = ?", program.ProgramID).Updates(&program).Error
	if err != nil {
		return entity.Program{}, err
	}
	return program, nil
}

func (repository *ProgramRepository) Delete(ctx context.Context, programID uuid.UUID) error {
	err := repository.DB.WithContext(ctx).Where("program_id = ?", programID).Delete(&entity.Program{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (repository *ProgramRepository) FindByID(ctx context.Context, programID uuid.UUID) (entity.Program, error) {
	var program entity.Program
	result := repository.DB.WithContext(ctx).Unscoped().Where("program_id = ?", programID).First(&program)
	if result.RowsAffected == 0 {
		return entity.Program{}, errors.New("program not found")
	}
	return program, nil
}

func (repository *ProgramRepository) FindAll(ctx context.Context, params model.FindAllProgramsRequest) []entity.Program {
	var programs []entity.Program
	query := repository.DB.WithContext(ctx)

	if params.Search != "" {
		query = query.Where("name ILIKE ?", "%"+params.Search+"%")
	}

	if params.IsPublished != nil {
		query = query.Where("is_published = ?", params.IsPublished)
	}

	if params.UserID != "" {
		query = query.Joins("JOIN transaction_programs tp ON programs.program_id = tp.program_id").Where("tp.user_id = ?", params.UserID)
	}

	query = query.Order("open_registration DESC")

	query.Find(&programs)
	return programs
}
