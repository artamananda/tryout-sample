package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateEbookRequest struct {
	Title           string    `json:"title" validate:"required"`
	Author          string    `json:"author" validate:"required"`
	Description     string    `json:"description"`
	Publisher       string    `json:"publisher"`
	PublicationDate time.Time `json:"publication_date"`
	ISBN            string    `json:"isbn"`
	TotalPages      int       `json:"total_pages"`
	IsPublished     bool      `json:"is_published"`
	Category        string    `json:"category"`
	EbookURL        string    `json:"ebook_url"`
	CoverImageURL   string    `json:"cover_image_url"`
}

type FindAllEbookRequest struct {
	Search      string `json:"search"`
	IsPublished *bool  `json:"is_published"`
}

type UpdateEbookRequest struct {
	Title           string    `json:"title"`
	Author          string    `json:"author"`
	Description     string    `json:"description"`
	Publisher       string    `json:"publisher"`
	PublicationDate time.Time `json:"publication_date"`
	ISBN            string    `json:"isbn"`
	TotalPages      int       `json:"total_pages"`
	IsPublished     bool      `json:"is_published"`
	Category        string    `json:"category"`
	EbookURL        string    `json:"ebook_url"`
	CoverImageURL   string    `json:"cover_image_url"`
}

type EbookResponse struct {
	EbookID         uuid.UUID `json:"ebook_id"`
	Title           string    `json:"title"`
	Author          string    `json:"author"`
	Description     string    `json:"description"`
	Publisher       string    `json:"publisher"`
	PublicationDate time.Time `json:"publication_date"`
	ISBN            string    `json:"isbn"`
	TotalPages      int       `json:"total_pages"`
	IsPublished     bool      `json:"is_published"`
	Category        string    `json:"category"`
	EbookURL        string    `json:"ebook_url"`
	CoverImageURL   string    `json:"cover_image_url"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
