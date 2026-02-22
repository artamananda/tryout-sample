package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/entity"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
	"github.com/artamananda/tryout-sample/internal/repository"
	"github.com/google/uuid"
)

type AIService struct {
	Config                 config.Config
	AIClient               *common.AIClient
	ChatLogRepository      *repository.ChatLogRepository
	AIExampleRepository    *repository.AIExampleRepository
	ChatArtifactRepository *repository.ChatArtifactRepository
}

func NewAIService(cfg config.Config, chatLogRepo *repository.ChatLogRepository, aiExampleRepo *repository.AIExampleRepository, chatArtifactRepo *repository.ChatArtifactRepository) AIService {
	return AIService{
		Config:                 cfg,
		AIClient:               common.NewAIClient(cfg.Get),
		ChatLogRepository:      chatLogRepo,
		AIExampleRepository:    aiExampleRepo,
		ChatArtifactRepository: chatArtifactRepo,
	}
}

// AI types are now handled by common.AIClient

func (service *AIService) GenerateQuestions(ctx context.Context, request model.GenerateQuestionsRequest) (model.GenerateQuestionsResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	if !service.AIClient.IsConfigured() {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: "AI provider not configured: API key missing",
		}
	}

	prompt := buildPrompt(request)

	aiResp, err := service.AIClient.Chat(ctx, common.AIRequest{
		Messages: []common.AIMessage{
			{
				Role: "system",
				Content: `Kamu adalah pembuat soal UTBK (Ujian Tulis Berbasis Komputer) profesional Indonesia.
Buat soal berkualitas tinggi setara soal UTBK resmi dari SNPMB.
Semua soal WAJIB dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris).
Setiap soal harus memiliki tepat 5 pilihan jawaban (A, B, C, D, E).
correct_answer harus berupa huruf tunggal (A, B, C, D, atau E).
Sertakan penjelasan lengkap untuk setiap jawaban.
Respon HANYA dengan JSON yang valid, tanpa markdown blocks.

ATURAN WACANA/TEKS BACAAN (SANGAT PENTING):
- Jika soal memerlukan wacana/teks bacaan/stimulus/tabel/data, 
  sertakan teks tersebut LENGKAP di field "text" SETIAP soal.
- JANGAN pernah menulis wacana hanya di satu soal lalu merujuknya dari soal lain.
- Setiap soal harus BERDIRI SENDIRI karena soal ditampilkan satu per satu dan bisa diacak.
- Wacana TIDAK BOLEH dipotong atau disingkat. Field "text" boleh panjang.
- Gunakan format HTML: <p><b>Bacalah teks berikut!</b></p><p>[wacana lengkap]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>`,
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	})
	if err != nil {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: "AI API error: " + err.Error(),
		}
	}

	content := common.CleanJSONContent(aiResp.Content)

	var result model.GenerateQuestionsResponse
	err = json.Unmarshal([]byte(content), &result)
	if err != nil {
		// Try parsing as array directly
		var questions []model.GeneratedQuestion
		if jsonErr := json.Unmarshal([]byte(content), &questions); jsonErr == nil {
			result.Questions = questions
		} else {
			return model.GenerateQuestionsResponse{}, exception.ValidationError{
				Message: "Failed to parse AI response: " + err.Error(),
			}
		}
	}

	return result, nil
}

func buildPrompt(request model.GenerateQuestionsRequest) string {
	questionTypeName := getQuestionTypeName(request.QuestionType)

	difficultyDesc := map[string]string{
		"easy":   "mudah - menguji pemahaman dasar, satu langkah penyelesaian",
		"medium": "sedang - menguji penerapan konsep, 2-3 langkah penyelesaian",
		"hard":   "sulit - menguji analisis tingkat tinggi, multi-langkah",
	}
	diffText := difficultyDesc[request.Difficulty]
	if diffText == "" {
		diffText = request.Difficulty
	}

	prompt := fmt.Sprintf(`Buatkan %d soal UTBK dengan tingkat kesulitan %s tentang "%s" untuk kategori %s.

KETENTUAN:
- Semua soal WAJIB dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris)
- Setiap soal harus memiliki tepat 5 pilihan jawaban (A, B, C, D, E)
- Soal harus berkualitas tinggi, setara dengan soal UTBK resmi
- Setiap pilihan jawaban harus masuk akal (plausible distractors)
- Sertakan penjelasan lengkap mengapa jawaban tersebut benar
- Gunakan konteks yang relevan dengan Indonesia
- PENTING: Jika soal memerlukan wacana/teks bacaan, sertakan wacana LENGKAP 
  di field "text" SETIAP soal. Jangan pisahkan wacana dari soal.
  Gunakan HTML: <p><b>Bacalah teks berikut!</b></p><p>[wacana]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>

%s

Format JSON:
{
  "questions": [
    {
      "text": "<p><b>Bacalah teks berikut!</b></p><p>[wacana lengkap jika diperlukan]</p><p><b>Pertanyaan:</b> Teks pertanyaan di sini?</p>",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4", "E. Pilihan 5"],
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap mengapa A benar"
    }
  ]
}`,
		request.NumberOfQuestions,
		diffText,
		request.Topic,
		questionTypeName,
		getContextSection(request.Context),
	)

	return prompt
}

func getQuestionTypeName(code string) string {
	typeNames := map[string]string{
		"kpu": "Penalaran Umum (General Reasoning)",
		"ppu": "Pengetahuan dan Pemahaman Umum (General Knowledge)",
		"pbm": "Pemahaman Bacaan dan Menulis (Reading and Writing)",
		"pku": "Pengetahuan Kuantitatif (Quantitative Knowledge)",
		"ind": "Literasi Bahasa Indonesia (Indonesian Literacy)",
		"ing": "Literasi Bahasa Inggris (English Literacy)",
		"mtk": "Penalaran Matematika (Mathematical Reasoning)",
	}

	if name, exists := typeNames[code]; exists {
		return name
	}
	return code
}

func getContextSection(context string) string {
	if context == "" {
		return ""
	}
	return fmt.Sprintf("\nAdditional context/material to base questions on:\n%s", context)
}

func (service *AIService) Chat(ctx context.Context, request model.AIChatRequest, adminID string) (model.AIChatResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	if !service.AIClient.IsConfigured() {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: "AI provider not configured: API key missing",
		}
	}

	// Build system message based on mode
	var systemMessage string
	if request.Mode == "generate" {
		formatInstruction := "Sediakan 5 pilihan jawaban (Pilihan Ganda A-E). 'correct_answer' berupa satu huruf (misal 'A')."
		if request.QuestionFormat == "essay" {
			formatInstruction = "JANGAN sediakan pilihan (array kosong). 'correct_answer' berisi jawaban model atau rubrik penilaian."
		} else if request.QuestionFormat == "multiple_answer" {
			formatInstruction = "Sediakan 5 pilihan jawaban. 'correct_answer' berisi semua huruf jawaban benar (misal 'A, C')."
		} else if request.QuestionFormat == "short_answer" {
			formatInstruction = "JANGAN sediakan pilihan (array kosong). 'correct_answer' berisi kunci jawaban singkat."
		}

		systemMessage = `Kamu adalah pembuat soal UTBK (Ujian Tulis Berbasis Komputer) profesional Indonesia.
Kamu memiliki keahlian dalam membuat soal seleksi masuk perguruan tinggi negeri yang berkualitas tinggi.

Ketika menerima permintaan untuk membuat soal:
1. Buat soal sesuai format: ` + formatInstruction + `
2. Semua soal WAJIB dalam Bahasa Indonesia (kecuali Literasi Bahasa Inggris)
3. Soal harus setara kualitas UTBK resmi dari SNPMB
4. Gunakan konteks yang relevan dengan Indonesia
5. Setiap pilihan jawaban harus masuk akal (plausible distractors)
6. PENTING - ATURAN WACANA: Jika soal memerlukan wacana/teks bacaan/stimulus,
   sertakan wacana LENGKAP di field "text" SETIAP soal. Jangan pisahkan wacana dari pertanyaan.
   Setiap soal harus berdiri sendiri karena ditampilkan satu per satu dan bisa diacak.
   Gunakan format HTML: <p><b>Bacalah teks berikut!</b></p><p>[wacana lengkap]</p><p><b>Pertanyaan:</b> [pertanyaan]</p>

Kembalikan respons JSON seperti ini:
{
  "message": "Saya telah membuat N soal tentang [topik].",
  "is_generating": true,
  "questions": [
    {
      "text": "<p><b>Bacalah teks berikut!</b></p><p>[wacana lengkap jika diperlukan]</p><p><b>Pertanyaan:</b> Teks pertanyaan?</p>",
      "options": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4", "E. Pilihan 5"],
      "correct_answer": "A",
      "explanation": "Penjelasan lengkap mengapa A benar",
      "type": "` + request.QuestionFormat + `"
    }
  ]
}

SELALU respon dengan JSON yang valid saja. Jangan gunakan markdown blocks.`
	} else {
		systemMessage = `Kamu adalah asisten AI yang membantu guru dan admin dalam membuat soal UTBK (Ujian Tulis Berbasis Komputer) berkualitas tinggi.

Kemampuanmu:
1. Mendiskusikan topik dan membantu menyempurnakan ide soal
2. Menyarankan jenis soal dan tingkat kesulitan yang sesuai
3. Membantu merumuskan soal yang setara dengan UTBK resmi
4. Memberikan saran perbaikan untuk soal yang sudah ada

Ketika bercakap, respon dalam format JSON:
{
  "message": "Respon percakapanmu di sini (dalam Bahasa Indonesia)",
  "is_generating": false,
  "suggestion": "Saran opsional untuk langkah selanjutnya"
}

Jika pengguna ingin membuat soal, minta mereka memberikan:
- Topik/materi soal
- Jumlah soal yang diinginkan
- Tingkat kesulitan (mudah/sedang/sulit)
- Jenis soal jika belum ditentukan

SELALU respon dalam Bahasa Indonesia. SELALU respon dengan JSON yang valid saja.`
	}

	// Inject examples if Topic is available
	var usedExamples []entity.AIExample
	if request.Topic != "" {
		var examplesContext string
		examplesContext, usedExamples = service.includeContext(ctx, request.Topic)
		if examplesContext != "" {
			systemMessage += examplesContext
		}
	}

	// Convert messages to AI client format
	var aiMessages []common.AIMessage
	aiMessages = append(aiMessages, common.AIMessage{
		Role:    "system",
		Content: systemMessage,
	})

	for _, msg := range request.Messages {
		aiMessages = append(aiMessages, common.AIMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	aiResp, err := service.AIClient.Chat(ctx, common.AIRequest{
		Messages: aiMessages,
	})
	if err != nil {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: "AI API error: " + err.Error(),
		}
	}

	content := aiResp.Content

	// Extract and clean JSON
	cleanContent := service.extractJSON(content)

	// Remove markdown if leftovers (though extractJSON should handle bounds)
	cleanContent = strings.ReplaceAll(cleanContent, "```json", "")
	cleanContent = strings.ReplaceAll(cleanContent, "```", "")

	var result model.AIChatResponse
	err = json.Unmarshal([]byte(cleanContent), &result)
	if err != nil {
		fmt.Printf("JSON Parse Error: %v\nContent: %s\n", err, content) // Debug Log
		// If JSON parsing fails, return as plain message
		result = model.AIChatResponse{
			Message:      content,
			IsGenerating: false,
		}
	}

	// --- PERSISTENCE LOGIC START ---
	// Update history
	// --- PERSISTENCE LOGIC ---
	var chatLogID uuid.UUID
	var errUUID error
	adminUUID, _ := uuid.Parse(adminID)

	if request.SessionID != "" {
		chatLogID, errUUID = uuid.Parse(request.SessionID)
		if errUUID != nil {
			chatLogID = uuid.New() // Fallback
		}
	} else {
		chatLogID = uuid.New()
	}

	// 1. Store Generated Artifacts First (to get IDs)
	var artifactIDs []string
	if result.IsGenerating && len(result.Questions) > 0 {
		var referencesJSON []byte
		if len(usedExamples) > 0 {
			referencesJSON, _ = json.Marshal(usedExamples)
		}

		for _, q := range result.Questions {
			qBytes, _ := json.Marshal(q)
			artifact := entity.ChatArtifact{
				ID:             uuid.New(),
				ChatLogID:      chatLogID,
				Type:           "question",
				Content:        json.RawMessage(qBytes),
				ReferencesData: json.RawMessage(referencesJSON),
				Metadata:       json.RawMessage([]byte(`{"source": "ai_generated"}`)),
				Status:         "generated",
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			}
			service.ChatArtifactRepository.Create(ctx, &artifact)
			artifactIDs = append(artifactIDs, artifact.ID.String())
		}
		result.ArtifactIDs = artifactIDs
	}

	// 2. Prepare Assistant Message
	assistantMsg := model.AIChatMessage{
		Role:        "assistant",
		Content:     result.Message,
		ArtifactIDs: artifactIDs,
	}

	// 3. Save Chat Log
	if request.SessionID != "" {
		chatLog, err := service.ChatLogRepository.FindByID(ctx, chatLogID)
		if err == nil {
			var currentMessages []model.AIChatMessage
			json.Unmarshal(chatLog.Messages, &currentMessages)

			// Append User Message (Last one)
			if len(request.Messages) > 0 {
				lastUserMsg := request.Messages[len(request.Messages)-1]
				if lastUserMsg.Role == "user" {
					currentMessages = append(currentMessages, lastUserMsg)
				}
			}

			// Append Assistant Message
			currentMessages = append(currentMessages, assistantMsg)

			chatLogBytes, _ := json.Marshal(currentMessages)
			chatLog.Messages = json.RawMessage(chatLogBytes)
			chatLog.UpdatedAt = time.Now()

			// Update Topic if needed
			if chatLog.Topic == "" || strings.HasPrefix(chatLog.Topic, "New Chat") {
				if len(request.Messages) > 0 {
					firstMsg := request.Messages[len(request.Messages)-1].Content
					if len(firstMsg) > 30 {
						chatLog.Topic = firstMsg[:30] + "..."
					} else {
						chatLog.Topic = firstMsg
					}
				}
			}

			service.ChatLogRepository.Update(ctx, chatLog)
		} else {
			// Fallback: Create New if ID not found but supplied
			var newMessages []model.AIChatMessage
			// Append User Message (Last one)
			if len(request.Messages) > 0 {
				lastUserMsg := request.Messages[len(request.Messages)-1]
				if lastUserMsg.Role == "user" {
					newMessages = append(newMessages, lastUserMsg)
				}
			}
			newMessages = append(newMessages, assistantMsg)
			chatLogBytes, _ := json.Marshal(newMessages)

			newLog := entity.ChatLog{
				ChatLogID:    chatLogID,
				AdminID:      adminUUID,
				QuestionType: request.QuestionType,
				Topic:        request.Topic,
				Messages:     json.RawMessage(chatLogBytes),
				Status:       "active",
				CreatedAt:    time.Now(),
				UpdatedAt:    time.Now(),
			}

			if newLog.Topic == "" {
				if len(newMessages) > 0 {
					firstMsg := newMessages[0].Content
					if len(firstMsg) > 30 {
						newLog.Topic = firstMsg[:30] + "..."
					} else {
						newLog.Topic = firstMsg
					}
				} else {
					newLog.Topic = "New Chat " + time.Now().Format("15:04")
				}
			}
			service.ChatLogRepository.Create(ctx, newLog)
		}
	} else {
		// Create Messages Array
		var newMessages []model.AIChatMessage
		// Append User Message (Last one)
		if len(request.Messages) > 0 {
			lastUserMsg := request.Messages[len(request.Messages)-1]
			if lastUserMsg.Role == "user" {
				newMessages = append(newMessages, lastUserMsg)
			}
		}
		newMessages = append(newMessages, assistantMsg)
		chatLogBytes, _ := json.Marshal(newMessages)

		newLog := entity.ChatLog{
			ChatLogID:    chatLogID,
			AdminID:      adminUUID,
			QuestionType: request.QuestionType,
			Topic:        request.Topic,
			Messages:     json.RawMessage(chatLogBytes),
			Status:       "active",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		if newLog.Topic == "" {
			// Generate Topic from User Message
			if len(newMessages) > 0 {
				firstMsg := newMessages[0].Content
				if len(firstMsg) > 30 {
					newLog.Topic = firstMsg[:30] + "..."
				} else {
					newLog.Topic = firstMsg
				}
			} else {
				newLog.Topic = "New Chat " + time.Now().Format("15:04")
			}
		}
		service.ChatLogRepository.Create(ctx, newLog)
	}

	result.SessionID = chatLogID.String()
	// --- PERSISTENCE LOGIC END ---

	return result, nil
}

func (service *AIService) SaveChatLog(ctx context.Context, request model.SaveChatLogRequest, adminID string) error {
	err := common.Validate(request)
	if err != nil {
		return exception.ValidationError{
			Message: err.Error(),
		}
	}

	adminUUID, err := uuid.Parse(adminID)
	if err != nil {
		return exception.ValidationError{
			Message: "Invalid Admin ID",
		}
	}

	messagesJSON, err := json.Marshal(request.Messages)
	if err != nil {
		return err
	}

	chatLog := entity.ChatLog{
		AdminID:      adminUUID,
		QuestionType: request.QuestionType,
		Topic:        request.Topic,
		Messages:     messagesJSON,
		Status:       entity.ChatLogStatusPending,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	_, err = service.ChatLogRepository.Create(ctx, chatLog)
	return err
}

func (service *AIService) GetHistory(ctx context.Context, adminID string) ([]entity.ChatLog, error) {
	uuidID, err := uuid.Parse(adminID)
	if err != nil {
		return nil, err
	}
	return service.ChatLogRepository.FindByAdminID(ctx, uuidID)
}

func (service *AIService) GetSession(ctx context.Context, id string) (entity.ChatLog, error) {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return entity.ChatLog{}, err
	}
	return service.ChatLogRepository.FindByID(ctx, uuidID)
}

func (service *AIService) DeleteSession(ctx context.Context, id string) error {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	return service.ChatLogRepository.Delete(ctx, uuidID)
}

func (service *AIService) UpdateSession(ctx context.Context, id string, request model.UpdateChatLogRequest, adminID string) error {
	uuidID, err := uuid.Parse(id)
	if err != nil {
		return err
	}

	chatLog, err := service.ChatLogRepository.FindByID(ctx, uuidID)
	if err != nil {
		return err
	}

	adminUUID, err := uuid.Parse(adminID)
	if err != nil {
		return err
	}

	if chatLog.AdminID != adminUUID {
		return exception.ValidationError{Message: "Unauthorized to update this session"}
	}

	chatLog.Topic = request.Topic
	chatLog.UpdatedAt = time.Now()

	return service.ChatLogRepository.Update(ctx, chatLog)
}

func (service *AIService) SaveExample(ctx context.Context, request model.SaveAIExampleRequest, adminID string) error {
	adminUUID, err := uuid.Parse(adminID)
	if err != nil {
		return err
	}

	example := entity.AIExample{
		ID:        uuid.New(),
		CreatedBy: adminUUID,
		Topic:     request.Topic,
		Content:   request.Content,
		CreatedAt: time.Now(),
	}

	return service.AIExampleRepository.Save(ctx, example)
}

func (service *AIService) includeContext(ctx context.Context, topic string) (string, []entity.AIExample) {
	if topic == "" {
		return "", nil
	}
	examples, err := service.AIExampleRepository.FindByTopic(ctx, topic, 3)
	if err != nil || len(examples) == 0 {
		return "", nil
	}

	var contextMsg string
	contextMsg += "\n\nReferensi contoh soal/dataset UTBK yang relevan (gunakan gaya dan tingkat kesulitan serupa, pastikan soal dalam Bahasa Indonesia):\n"
	for _, example := range examples {
		contextMsg += fmt.Sprintf("- %s\n", example.Content)
	}
	return contextMsg, examples
}

func (service *AIService) GetSessionArtifacts(ctx context.Context, sessionID string) ([]entity.ChatArtifact, error) {
	return service.ChatArtifactRepository.FindByChatLogID(ctx, sessionID)
}

func (service *AIService) extractJSON(content string) string {
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	if start != -1 && end != -1 && start < end {
		return content[start : end+1]
	}
	return content
}

func (service *AIService) RefineArtifact(ctx context.Context, artifactID string, instruction string) (*entity.ChatArtifact, error) {
	// Find Artifact
	artifact, err := service.ChatArtifactRepository.FindByID(ctx, artifactID) // Need FindByID implementation?
	// Assuming FindByID exists or usage of generic Find
	// If not, I'll check Repo first.
	// Wait, ChatArtifactRepository only has FindByChatLogID and Create/Update.
	// I need FindByID.
	if err != nil {
		return nil, err
	}

	// Build Prompt
	systemPrompt := "Kamu adalah editor soal UTBK profesional. Perbarui soal berikut berdasarkan instruksi pengguna. Pastikan soal tetap dalam Bahasa Indonesia (kecuali untuk Literasi Bahasa Inggris) dan berkualitas setara soal UTBK resmi. Output HANYA soal yang sudah diperbarui dalam format JSON."
	userPrompt := fmt.Sprintf("JSON Soal Asli: %s\n\nInstruksi: %s\n\nOutput JSON:", artifact.Content, instruction)

	// Call AI using the shared client (uses vision model for higher quality on refine)
	aiResp, err := service.AIClient.Chat(ctx, common.AIRequest{
		Messages: []common.AIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.7,
		UseVision:   true, // Use higher-quality model for refine
	})
	if err != nil {
		return nil, err
	}

	jsonContent := service.extractJSON(aiResp.Content)

	// Update Artifact
	// Store old content in metadata?
	// Map existing metadata
	// For now just overwrite content
	artifact.Content = json.RawMessage(jsonContent)
	artifact.Status = "refined"

	// Update DB
	if err := service.ChatArtifactRepository.Update(ctx, artifact); err != nil {
		return nil, err
	}

	return artifact, nil
}

func (service *AIService) UpdateArtifact(ctx context.Context, id string, content model.GeneratedQuestion) (*entity.ChatArtifact, error) {
	artifact, err := service.ChatArtifactRepository.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	bytes, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}

	artifact.Content = json.RawMessage(bytes)
	artifact.Status = "edited"
	artifact.UpdatedAt = time.Now()

	if err := service.ChatArtifactRepository.Update(ctx, artifact); err != nil {
		return nil, err
	}

	return artifact, nil
}

func (service *AIService) DeleteArtifact(ctx context.Context, id string) error {
	return service.ChatArtifactRepository.Delete(ctx, id)
}

func (service *AIService) ApproveArtifact(ctx context.Context, id string) error {
	artifact, err := service.ChatArtifactRepository.FindByID(ctx, id)
	if err != nil {
		return err
	}
	artifact.Status = "approved"
	artifact.UpdatedAt = time.Now()
	return service.ChatArtifactRepository.Update(ctx, artifact)
}
