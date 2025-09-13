package entity

import (
	"time"

	"github.com/google/uuid"
)

type Ebook struct {
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

func (Ebook) TableName() string {
	return "ebooks"
}
