package service

import (
	"context"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/helper"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
)

type EbookService struct {
	EbookRepository *repository.EbookRepository
	Uploader        *s3manager.Uploader
}

func NewEbookService(ebookRepository *repository.EbookRepository, uploader *s3manager.Uploader) EbookService {
	return EbookService{
		EbookRepository: ebookRepository,
		Uploader:        uploader,
	}
}

func (service *EbookService) Create(ctx context.Context, request model.CreateEbookRequest) (model.EbookResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.EbookResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	ebook := entity.Ebook{
		Title:           request.Title,
		Author:          request.Author,
		Description:     request.Description,
		Publisher:       request.Publisher,
		PublicationDate: request.PublicationDate,
		ISBN:            request.ISBN,
		TotalPages:      request.TotalPages,
		IsPublished:     request.IsPublished,
		Category:        request.Category,
		EbookURL:        request.EbookURL,
		CoverImageURL:   request.CoverImageURL,
	}

	ebook = service.EbookRepository.Create(ctx, ebook)

	return model.EbookResponse{
		EbookID:         ebook.EbookID,
		Title:           ebook.Title,
		Author:          ebook.Author,
		Description:     ebook.Description,
		Publisher:       ebook.Publisher,
		PublicationDate: ebook.PublicationDate,
		ISBN:            ebook.ISBN,
		TotalPages:      ebook.TotalPages,
		IsPublished:     ebook.IsPublished,
		Category:        ebook.Category,
		EbookURL:        ebook.EbookURL,
		CoverImageURL:   ebook.CoverImageURL,
		CreatedAt:       ebook.CreatedAt,
		UpdatedAt:       ebook.UpdatedAt,
	}, nil
}

func (service *EbookService) Update(ctx context.Context, request model.UpdateEbookRequest, ebookID string) (model.EbookResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.EbookResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	ebook, err := service.EbookRepository.FindById(ctx, ebookID)
	if err != nil {
		return model.EbookResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	ebook.Title = request.Title
	ebook.Author = request.Author
	ebook.Description = request.Description
	ebook.Publisher = request.Publisher
	ebook.PublicationDate = request.PublicationDate
	ebook.ISBN = request.ISBN
	ebook.TotalPages = request.TotalPages
	ebook.IsPublished = request.IsPublished
	ebook.Category = request.Category
	ebook.EbookURL = request.EbookURL
	ebook.CoverImageURL = request.CoverImageURL
	ebook.UpdatedAt = time.Now()

	ebook = service.EbookRepository.Update(ctx, ebook)

	return model.EbookResponse{
		EbookID:         ebook.EbookID,
		Title:           ebook.Title,
		Author:          ebook.Author,
		Description:     ebook.Description,
		Publisher:       ebook.Publisher,
		PublicationDate: ebook.PublicationDate,
		ISBN:            ebook.ISBN,
		TotalPages:      ebook.TotalPages,
		IsPublished:     ebook.IsPublished,
		Category:        ebook.Category,
		EbookURL:        ebook.EbookURL,
		CoverImageURL:   ebook.CoverImageURL,
		CreatedAt:       ebook.CreatedAt,
		UpdatedAt:       ebook.UpdatedAt,
	}, nil
}

func (service *EbookService) UpdateCover(ctx context.Context, request model.UploadFileRequest, ebookID string) (model.EbookResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.EbookResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	ebook, err := service.EbookRepository.FindById(ctx, ebookID)
	if err != nil {
		return model.EbookResponse{}, err
	}

	fileLink, err := helper.UploadFile(service.Uploader, request)

	if err != nil {
		return model.EbookResponse{}, err
	}

	ebook.CoverImageURL = fileLink
	ebook.UpdatedAt = time.Now()

	ebook = service.EbookRepository.Update(ctx, ebook)

	if err != nil {
		return model.EbookResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.EbookResponse{
		EbookID:         ebook.EbookID,
		Title:           ebook.Title,
		Author:          ebook.Author,
		Description:     ebook.Description,
		Publisher:       ebook.Publisher,
		PublicationDate: ebook.PublicationDate,
		ISBN:            ebook.ISBN,
		TotalPages:      ebook.TotalPages,
		IsPublished:     ebook.IsPublished,
		Category:        ebook.Category,
		EbookURL:        ebook.EbookURL,
		CoverImageURL:   ebook.CoverImageURL,
		CreatedAt:       ebook.CreatedAt,
		UpdatedAt:       ebook.UpdatedAt,
	}, nil
}

func (service *EbookService) UpdateFile(ctx context.Context, request model.UploadFileRequest, ebookID string) (model.EbookResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.EbookResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	ebook, err := service.EbookRepository.FindById(ctx, ebookID)
	if err != nil {
		return model.EbookResponse{}, err
	}

	fileLink, err := helper.UploadFile(service.Uploader, request)

	if err != nil {
		return model.EbookResponse{}, err
	}

	ebook.EbookURL = fileLink
	ebook.UpdatedAt = time.Now()

	ebook = service.EbookRepository.Update(ctx, ebook)

	if err != nil {
		return model.EbookResponse{}, exception.NotFoundError{
			Message: err.Error(),
		}
	}

	return model.EbookResponse{
		EbookID:         ebook.EbookID,
		Title:           ebook.Title,
		Author:          ebook.Author,
		Description:     ebook.Description,
		Publisher:       ebook.Publisher,
		PublicationDate: ebook.PublicationDate,
		ISBN:            ebook.ISBN,
		TotalPages:      ebook.TotalPages,
		IsPublished:     ebook.IsPublished,
		Category:        ebook.Category,
		EbookURL:        ebook.EbookURL,
		CoverImageURL:   ebook.CoverImageURL,
		CreatedAt:       ebook.CreatedAt,
		UpdatedAt:       ebook.UpdatedAt,
	}, nil
}

func (service *EbookService) Delete(ctx context.Context, ebookID string) error {
	ebook, err := service.EbookRepository.FindById(ctx, ebookID)
	if err != nil {
		return exception.NotFoundError{
			Message: err.Error(),
		}
	}

	service.EbookRepository.Delete(ctx, ebook)

	return nil
}

func (service *EbookService) FindByID(ctx context.Context, ebookID string) (model.EbookResponse, error) {
	ebook, err := service.EbookRepository.FindById(ctx, ebookID)
	if err != nil {
		return model.EbookResponse{}, err
	}

	return model.EbookResponse{
		EbookID:         ebook.EbookID,
		Title:           ebook.Title,
		Author:          ebook.Author,
		Description:     ebook.Description,
		Publisher:       ebook.Publisher,
		PublicationDate: ebook.PublicationDate,
		ISBN:            ebook.ISBN,
		TotalPages:      ebook.TotalPages,
		IsPublished:     ebook.IsPublished,
		Category:        ebook.Category,
		EbookURL:        ebook.EbookURL,
		CoverImageURL:   ebook.CoverImageURL,
		CreatedAt:       ebook.CreatedAt,
		UpdatedAt:       ebook.UpdatedAt,
	}, nil
}

func (service *EbookService) FindAll(ctx context.Context, params model.FindAllEbookRequest) []model.EbookResponse {
	ebooks := service.EbookRepository.FindAll(ctx, params)

	ebookResponses := []model.EbookResponse{}
	for _, ebook := range ebooks {
		ebookResponses = append(ebookResponses,
			model.EbookResponse{
				EbookID:         ebook.EbookID,
				Title:           ebook.Title,
				Author:          ebook.Author,
				Description:     ebook.Description,
				Publisher:       ebook.Publisher,
				PublicationDate: ebook.PublicationDate,
				ISBN:            ebook.ISBN,
				TotalPages:      ebook.TotalPages,
				IsPublished:     ebook.IsPublished,
				Category:        ebook.Category,
				EbookURL:        ebook.EbookURL,
				CoverImageURL:   ebook.CoverImageURL,
				CreatedAt:       ebook.CreatedAt,
				UpdatedAt:       ebook.UpdatedAt,
			},
		)
	}
	if len(ebooks) == 0 {
		return []model.EbookResponse{}
	}
	return ebookResponses
}

func (service *EbookService) FindAllAsAdmin(ctx context.Context, params model.FindAllEbookRequest) []model.EbookResponse {
	ebooks := service.EbookRepository.FindAll(ctx, params)

	ebookResponses := []model.EbookResponse{}
	for _, ebook := range ebooks {
		ebookResponses = append(ebookResponses,
			model.EbookResponse{
				EbookID:         ebook.EbookID,
				Title:           ebook.Title,
				Author:          ebook.Author,
				Description:     ebook.Description,
				Publisher:       ebook.Publisher,
				PublicationDate: ebook.PublicationDate,
				ISBN:            ebook.ISBN,
				TotalPages:      ebook.TotalPages,
				IsPublished:     ebook.IsPublished,
				Category:        ebook.Category,
				EbookURL:        ebook.EbookURL,
				CoverImageURL:   ebook.CoverImageURL,
				CreatedAt:       ebook.CreatedAt,
				UpdatedAt:       ebook.UpdatedAt,
			},
		)
	}
	if len(ebooks) == 0 {
		return []model.EbookResponse{}
	}
	return ebookResponses
}
