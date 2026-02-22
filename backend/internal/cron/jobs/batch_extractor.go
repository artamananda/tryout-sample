package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type BatchExtractor struct {
	config       config.Config
	aiClient     *common.AIClient
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
		aiClient:     common.NewAIClient(cfg.Get),
		chatLogRepo:  chatLogRepo,
		bankSoalRepo: bankSoalRepo,
	}
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
	if !j.aiClient.IsConfigured() {
		return fmt.Errorf("AI provider not configured: API key missing")
	}

	// Parse messages from chat log
	var messages []entity.ChatMessage
	if err := json.Unmarshal(chatLog.Messages, &messages); err != nil {
		return fmt.Errorf("failed to parse messages: %w", err)
	}

	// Build prompt to extract questions from conversation
	prompt := buildExtractionPrompt(chatLog.Topic, chatLog.QuestionType, messages)

	aiResp, err := j.aiClient.Chat(ctx, common.AIRequest{
		Messages: []common.AIMessage{
			{
				Role:    "system",
				Content: "Kamu adalah ahli dalam mengekstrak soal ujian terstruktur dari percakapan. Ekstrak semua soal yang dibahas dan format sebagai JSON. Semua soal harus dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris) dan berkualitas setara UTBK resmi. Setiap soal harus memiliki 5 pilihan jawaban (A-E).",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	})
	if err != nil {
		return fmt.Errorf("AI request failed: %w", err)
	}

	content := common.CleanJSONContent(aiResp.Content)

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
