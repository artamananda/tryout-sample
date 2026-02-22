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
)

type AutoTagger struct {
	config       config.Config
	bankSoalRepo *repository.BankSoalRepository
}

func NewAutoTagger(cfg config.Config, bankSoalRepo *repository.BankSoalRepository) *AutoTagger {
	return &AutoTagger{
		config:       cfg,
		bankSoalRepo: bankSoalRepo,
	}
}

type TagResponse struct {
	Category   string   `json:"category"`
	Difficulty string   `json:"difficulty"`
	Tags       []string `json:"tags"`
}

func (j *AutoTagger) Run() error {
	ctx := context.Background()

	// Get all draft questions that haven't been processed by cron
	drafts, err := j.bankSoalRepo.FindUnprocessedDrafts(ctx)
	if err != nil {
		return fmt.Errorf("failed to find draft questions: %w", err)
	}

	if len(drafts) == 0 {
		log.Println("[AutoTagger] No draft questions to process")
		return nil
	}

	log.Printf("[AutoTagger] Processing %d draft questions", len(drafts))

	apiKey := j.config.Get("OPENAI_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("OpenAI API key not configured")
	}

	for _, question := range drafts {
		if err := j.processQuestion(ctx, question, apiKey); err != nil {
			log.Printf("[AutoTagger] Error processing question %s: %v", question.BankSoalID, err)
		}
	}

	return nil
}

func (j *AutoTagger) processQuestion(ctx context.Context, question entity.BankSoal, apiKey string) error {
	prompt := fmt.Sprintf(`Analisis soal ujian UTBK berikut dan tentukan:
1. Tingkat kesulitan yang sesuai (easy, medium, hard)
2. Kategori/tag subjek

Kriteria tingkat kesulitan UTBK:
- easy: pemahaman dasar, satu langkah penyelesaian
- medium: penerapan konsep, 2-3 langkah penyelesaian
- hard: analisis tingkat tinggi, multi-langkah, sintesis

Soal: %s
Pilihan: %v
Jawaban Benar: %s
Topik Saat Ini: %s
Jenis Saat Ini: %s

Respon dengan format JSON ini:
{
  "category": "kategori_utama",
  "difficulty": "easy|medium|hard",
  "tags": ["tag1", "tag2"]
}`, question.Text, question.Options, question.CorrectAnswer, question.Topic, question.Type)

	openAIReq := openAIRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "Kamu adalah ahli dalam mengkategorikan dan menilai tingkat kesulitan soal ujian UTBK Indonesia. Selalu respon dengan JSON yang valid saja.",
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

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return err
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

	if len(openAIResp.Choices) == 0 {
		return fmt.Errorf("no response from OpenAI")
	}

	content := openAIResp.Choices[0].Message.Content

	var tagResp TagResponse
	if err := json.Unmarshal([]byte(content), &tagResp); err != nil {
		log.Printf("[AutoTagger] Failed to parse response for %s, using defaults", question.BankSoalID)
		tagResp.Difficulty = "medium"
	}

	// Update question with validated difficulty and mark as processed
	question.Difficulty = tagResp.Difficulty
	question.ProcessedByCron = true
	question.UpdatedAt = time.Now()

	if err := j.bankSoalRepo.UpdateDifficulty(ctx, question.BankSoalID, tagResp.Difficulty); err != nil {
		return fmt.Errorf("failed to update difficulty: %w", err)
	}

	if err := j.bankSoalRepo.MarkAsProcessed(ctx, question.BankSoalID); err != nil {
		return fmt.Errorf("failed to mark as processed: %w", err)
	}

	log.Printf("[AutoTagger] Tagged question %s with difficulty: %s", question.BankSoalID, tagResp.Difficulty)
	return nil
}
