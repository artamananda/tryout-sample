package repository

import (
	"context"
	"errors"

	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EbookRepository struct {
	*gorm.DB
}

func NewEbookRepository(DB *gorm.DB) EbookRepository {
	return EbookRepository{DB: DB}
}

func (repository *EbookRepository) Create(ctx context.Context, ebook entity.Ebook) (entity.Ebook, error) {
	ebook.EbookID = uuid.New()
	err := repository.DB.WithContext(ctx).Create(&ebook).Error
	if err != nil {
		return entity.Ebook{}, err
	}
	return ebook, nil
}

func (repository *EbookRepository) Update(ctx context.Context, ebook entity.Ebook) (entity.Ebook, error) {
	query := `
        UPDATE ebooks
        SET is_published = $1
        WHERE ebook_id = $2
    `
	err := repository.DB.WithContext(ctx).Where("ebook_id = ?", ebook.EbookID).Updates(&ebook).Error
	if err != nil {
		return entity.Ebook{}, err
	}

	if !ebook.IsPublished {
		repository.DB.WithContext(ctx).Where("ebook_id = ?", ebook.EbookID).Exec(query, ebook.IsPublished, ebook.EbookID)
	}

	return ebook, nil
}

func (repository *EbookRepository) Delete(ctx context.Context, ebook entity.Ebook) error {
	err := repository.DB.WithContext(ctx).Where("ebook_id = ?", ebook.EbookID).Delete(&ebook).Error
	if err != nil {
		return err
	}
	return nil
}

func (repository *EbookRepository) FindById(ctx context.Context, ebookId string) (entity.Ebook, error) {
	var ebook entity.Ebook
	result := repository.DB.WithContext(ctx).Unscoped().Where("ebook_id = ?", ebookId).First(&ebook)
	if result.RowsAffected == 0 {
		return entity.Ebook{}, errors.New("ebook Not Found")
	}
	return ebook, nil
}

func (repository *EbookRepository) FindAll(ctx context.Context, params model.FindAllEbookRequest) []entity.Ebook {
	var ebooks []entity.Ebook
	query := repository.DB.WithContext(ctx)

	if params.Search != "" {
		query = query.Where("title ILIKE ?", "%"+params.Search+"%")
	}

	if params.IsPublished != nil {
		query = query.Where("is_published = ?", params.IsPublished)
	}

	query.Find(&ebooks)
	return ebooks
}
