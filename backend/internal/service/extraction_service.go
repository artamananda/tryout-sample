package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"errors"
	"io"
	"mime/multipart"
	"path/filepath"
	"strings"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/ledongthuc/pdf"
)

type ExtractionService struct {
	Config   config.Config
	AIClient *common.AIClient
}

func NewExtractionService(cfg config.Config) *ExtractionService {
	return &ExtractionService{
		Config:   cfg,
		AIClient: common.NewAIClient(cfg.Get),
	}
}

func (s *ExtractionService) ExtractText(file *multipart.FileHeader) (string, error) {
	src, err := file.Open()
	if err != nil {
		return "", err
	}
	defer src.Close()

	ext := strings.ToLower(filepath.Ext(file.Filename))

	switch ext {
	case ".pdf":
		return s.extractPDF(src, file.Size)
	case ".txt", ".md", ".json", ".csv":
		return s.extractText(src)
	case ".png", ".jpg", ".jpeg":
		// We need to read the full file bytes for Base64
		// src is io.Reader (multipart.File). We can read it all.
		// Be careful with large files, but images should be manageable (< 10MB typically)
		fileBytes, err := io.ReadAll(src)
		if err != nil {
			return "", err
		}
		return s.extractImage(fileBytes, ext)
	default:
		return "", errors.New("unsupported file type: " + ext)
	}
}

func (s *ExtractionService) extractText(r io.Reader) (string, error) {
	buf := new(bytes.Buffer)
	_, err := buf.ReadFrom(r)
	if err != nil {
		return "", err
	}
	return buf.String(), nil
}

func (s *ExtractionService) extractPDF(r io.ReaderAt, size int64) (string, error) {
	pdfReader, err := pdf.NewReader(r, size)
	if err != nil {
		return "", err
	}

	var content strings.Builder
	for i := 1; i <= pdfReader.NumPage(); i++ {
		p := pdfReader.Page(i)
		if p.V.IsNull() {
			continue
		}
		text, err := p.GetPlainText(nil)
		if err != nil {
			continue
		}
		content.WriteString(text)
		content.WriteString("\n")
	}
	return content.String(), nil
}

func (s *ExtractionService) extractImage(fileBytes []byte, ext string) (string, error) {
	if !s.AIClient.IsConfigured() {
		return "", errors.New("AI provider not configured: API key missing")
	}

	mimeType := "image/jpeg"
	if ext == ".png" {
		mimeType = "image/png"
	}

	encoded := base64.StdEncoding.EncodeToString(fileBytes)

	messages := []map[string]interface{}{
		{
			"role": "user",
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": "Transcribe ALL text from this image exactly as it appears. If there are tables, try to represent them clearly.",
				},
				{
					"type": "image_url",
					"image_url": map[string]string{
						"url": "data:" + mimeType + ";base64," + encoded,
					},
				},
			},
		},
	}

	ctx := context.Background()
	aiResp, err := s.AIClient.ChatWithVision(ctx, messages, 0)
	if err != nil {
		return "", err
	}

	return aiResp.Content, nil
}
