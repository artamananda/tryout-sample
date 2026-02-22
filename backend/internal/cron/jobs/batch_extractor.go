package jobs

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type BatchExtractor struct {
	config       config.Config
	chatLogRepo  *repository.ChatLogRepository
	bankSoalRepo *repository.BankSoalRepository
}

func NewBatchExtractor(
	cfg config.Config,
	chatLogRepo *repository.ChatLogRepository,
	bankSoalRepo *repository.BankSoalRepository,
) *BatchExtractor {
	return &BatchExtractor{
		config:       cfg,
		chatLogRepo:  chatLogRepo,
		bankSoalRepo: bankSoalRepo,
	}
}

type openAIRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

type GeneratedQuestion struct {
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
}

type GenerateResponse struct {
	Questions []GeneratedQuestion `json:"questions"`
}

func (j *BatchExtractor) Run() error {
	ctx := context.Background()

	// Get all pending chat logs
	pendingLogs, err := j.chatLogRepo.FindPending(ctx)
	if err != nil {
		return fmt.Errorf("failed to find pending chat logs: %w", err)
	}

	if len(pendingLogs) == 0 {
		log.Println("[BatchExtractor] No pending chat logs to process")
		return nil
	}

	log.Printf("[BatchExtractor] Processing %d pending chat logs", len(pendingLogs))

	for _, chatLog := range pendingLogs {
		if err := j.processLog(ctx, chatLog); err != nil {
			log.Printf("[BatchExtractor] Error processing log %s: %v", chatLog.ChatLogID, err)
			j.chatLogRepo.UpdateStatus(ctx, chatLog.ChatLogID, entity.ChatLogStatusFailed, err.Error())
		} else {
			j.chatLogRepo.UpdateStatus(ctx, chatLog.ChatLogID, entity.ChatLogStatusProcessed, "")
		}
	}

	return nil
}

func (j *BatchExtractor) processLog(ctx context.Context, chatLog entity.ChatLog) error {
	apiKey := j.config.Get("OPENAI_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("OpenAI API key not configured")
	}

	// Parse messages from chat log
	var messages []entity.ChatMessage
	if err := json.Unmarshal(chatLog.Messages, &messages); err != nil {
		return fmt.Errorf("failed to parse messages: %w", err)
	}

	// Build prompt to extract questions from conversation
	prompt := buildExtractionPrompt(chatLog.Topic, chatLog.QuestionType, messages)

	openAIReq := openAIRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "Kamu adalah ahli dalam mengekstrak soal ujian terstruktur dari percakapan. Ekstrak semua soal yang dibahas dan format sebagai JSON. Semua soal harus dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris) dan berkualitas setara UTBK resmi. Setiap soal harus memiliki 5 pilihan jawaban (A-E).",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	reqBody, err := json.Marshal(openAIReq)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 120 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return fmt.Errorf("API request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var openAIResp openAIResponse
	if err := json.Unmarshal(body, &openAIResp); err != nil {
		return err
	}

	if openAIResp.Error != nil {
		return fmt.Errorf("OpenAI error: %s", openAIResp.Error.Message)
	}

	if len(openAIResp.Choices) == 0 {
		return fmt.Errorf("no response from OpenAI")
	}

	content := openAIResp.Choices[0].Message.Content

	var result GenerateResponse
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		// Try parsing as array
		var questions []GeneratedQuestion
		if jsonErr := json.Unmarshal([]byte(content), &questions); jsonErr == nil {
			result.Questions = questions
		} else {
			return fmt.Errorf("failed to parse AI response: %w", err)
		}
	}

	// Save questions to bank_soal with draft status
	for _, q := range result.Questions {
		isOptions := true
		bankSoal := entity.BankSoal{
			BankSoalID:    uuid.New(),
			Type:          chatLog.QuestionType,
			Text:          q.Text,
			IsOptions:     &isOptions,
			Options:       q.Options,
			CorrectAnswer: q.CorrectAnswer,
			Explanation:   q.Explanation,
			Topic:         chatLog.Topic,
			Difficulty:    "medium", // Default, will be refined by AutoTagger
			IsAIGenerated: true,
			CreatedBy:     chatLog.AdminID,
			Status:        entity.BankSoalStatusDraft,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		if _, err := j.bankSoalRepo.Create(ctx, bankSoal); err != nil {
			log.Printf("[BatchExtractor] Failed to save question: %v", err)
		}
	}

	log.Printf("[BatchExtractor] Extracted %d questions from chat log %s", len(result.Questions), chatLog.ChatLogID)
	return nil
}

func buildExtractionPrompt(topic, questionType string, messages []entity.ChatMessage) string {
	var conversationText string
	for _, msg := range messages {
		conversationText += fmt.Sprintf("%s: %s\n", msg.Role, msg.Content)
	}

	return fmt.Sprintf(`Dari percakapan berikut tentang "%s" untuk ujian %s, ekstrak dan buat soal ujian terstruktur.

Percakapan:
%s

Buatkan soal pilihan ganda berdasarkan topik yang dibahas.
Semua soal HARUS dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris).
Setiap soal harus memiliki tepat 5 pilihan jawaban (A, B, C, D, E).

Respon dengan format JSON ini:
{
  "questions": [
    {
      "text": "Teks soal di sini?",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4", "E. Pilihan 5"],
      "correct_answer": "A",
      "explanation": "Penjelasan singkat"
    }
  ]
}`, topic, questionType, conversationText)
}
