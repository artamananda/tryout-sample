package service

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/ledongthuc/pdf"
)

type ExtractionService struct {
	Config config.Config
}

func NewExtractionService(cfg config.Config) *ExtractionService {
	return &ExtractionService{
		Config: cfg,
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
	apiKey := s.Config.Get("OPENAI_API_KEY")
	if apiKey == "" {
		return "", errors.New("OpenAI API key not configured")
	}

	mimeType := "image/jpeg"
	if ext == ".png" {
		mimeType = "image/png"
	}

	encoded := base64.StdEncoding.EncodeToString(fileBytes)

	reqVal := model.OpenAIChatRequest{
		Model: "gpt-4o", // Supports vision
		Messages: []model.OpenAIMessage{
			{
				Role: "user",
				Content: []map[string]interface{}{
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
		},
	}

	reqBody, err := json.Marshal(reqVal)
	if err != nil {
		return "", err
	}

	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return "", err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var openAIResp model.OpenAIChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return "", err
	}
	if len(openAIResp.Choices) == 0 {
		return "", errors.New("no response from AI")
	}

	content := openAIResp.Choices[0].Message.Content
	// Assert string
	if str, ok := content.(string); ok {
		return str, nil
	}
	return "", errors.New("unexpected non-string response from AI")
}
