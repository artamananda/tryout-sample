package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
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
	ChatLogRepository      *repository.ChatLogRepository
	AIExampleRepository    *repository.AIExampleRepository
	ChatArtifactRepository *repository.ChatArtifactRepository
}

func NewAIService(cfg config.Config, chatLogRepo *repository.ChatLogRepository, aiExampleRepo *repository.AIExampleRepository, chatArtifactRepo *repository.ChatArtifactRepository) AIService {
	return AIService{
		Config:                 cfg,
		ChatLogRepository:      chatLogRepo,
		AIExampleRepository:    aiExampleRepo,
		ChatArtifactRepository: chatArtifactRepo,
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

func (service *AIService) GenerateQuestions(ctx context.Context, request model.GenerateQuestionsRequest) (model.GenerateQuestionsResponse, error) {
	err := common.Validate(request)
	if err != nil {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: err.Error(),
		}
	}

	apiKey := service.Config.Get("OPENAI_API_KEY")
	if apiKey == "" {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: "OpenAI API key not configured",
		}
	}

	prompt := buildPrompt(request)

	openAIReq := openAIRequest{
		Model: "gpt-4o-mini",
		Messages: []openAIMessage{
			{
				Role:    "system",
				Content: "You are an expert exam question creator. Generate high-quality multiple choice questions in JSON format. Each question must have exactly 4 options labeled A, B, C, D. The correct_answer should be the letter (A, B, C, or D). Always respond with valid JSON only.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	reqBody, err := json.Marshal(openAIReq)
	if err != nil {
		return model.GenerateQuestionsResponse{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return model.GenerateQuestionsResponse{}, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return model.GenerateQuestionsResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return model.GenerateQuestionsResponse{}, err
	}

	var openAIResp openAIResponse
	err = json.Unmarshal(body, &openAIResp)
	if err != nil {
		return model.GenerateQuestionsResponse{}, err
	}

	if openAIResp.Error != nil {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: "OpenAI API error: " + openAIResp.Error.Message,
		}
	}

	if len(openAIResp.Choices) == 0 {
		return model.GenerateQuestionsResponse{}, exception.ValidationError{
			Message: "No response from OpenAI",
		}
	}

	content := openAIResp.Choices[0].Message.Content

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

	prompt := fmt.Sprintf(`Generate %d %s difficulty multiple choice questions about "%s" for a %s exam.

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Questions should be clear and unambiguous
- Options should be plausible but only one correct
- Include a brief explanation for the correct answer

%s

Respond with this exact JSON format:
{
  "questions": [
    {
      "text": "Question text here?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct_answer": "A",
      "explanation": "Brief explanation why A is correct"
    }
  ]
}`,
		request.NumberOfQuestions,
		request.Difficulty,
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

	apiKey := service.Config.Get("OPENAI_API_KEY")
	if apiKey == "" {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: "OpenAI API key not configured",
		}
	}

	// Build system message based on mode
	var systemMessage string
	if request.Mode == "generate" {
		systemMessage = `You are an expert exam question creator assistant. You help create multiple choice questions.

When you receive a request to generate questions:
1. Generate the questions in the format requested
2. Return a JSON response like this:
{
  "message": "I've generated N questions about [topic].",
  "is_generating": true,
  "questions": [
    {
      "text": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct_answer": "A",
      "explanation": "Why A is correct"
    }
  ]
}

Always respond with valid JSON only.`
	} else {
		systemMessage = `You are a helpful AI assistant for creating exam questions. You help teachers and admins prepare questions.

You can:
1. Discuss topics and help refine question ideas
2. Suggest question types and difficulty levels
3. When asked to generate questions, guide the user on what information you need

When chatting, respond in this JSON format:
{
  "message": "Your conversational response here",
  "is_generating": false,
  "suggestion": "Optional suggestion for what to do next"
}

If the user wants to generate questions, ask them to provide:
- Topic/subject matter
- Number of questions
- Difficulty level (easy/medium/hard)
- Question type if not specified

Always respond with valid JSON only.`
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

	// Convert messages to OpenAI format
	var openAIMessages []openAIMessage
	openAIMessages = append(openAIMessages, openAIMessage{
		Role:    "system",
		Content: systemMessage,
	})

	for _, msg := range request.Messages {
		openAIMessages = append(openAIMessages, openAIMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	openAIReq := openAIRequest{
		Model:    "gpt-4o-mini",
		Messages: openAIMessages,
	}

	reqBody, err := json.Marshal(openAIReq)
	if err != nil {
		return model.AIChatResponse{}, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return model.AIChatResponse{}, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		return model.AIChatResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return model.AIChatResponse{}, err
	}

	var openAIResp openAIResponse
	err = json.Unmarshal(body, &openAIResp)
	if err != nil {
		return model.AIChatResponse{}, err
	}

	if openAIResp.Error != nil {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: "OpenAI API error: " + openAIResp.Error.Message,
		}
	}

	if len(openAIResp.Choices) == 0 {
		return model.AIChatResponse{}, exception.ValidationError{
			Message: "No response from OpenAI",
		}
	}

	content := openAIResp.Choices[0].Message.Content

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
	newHistory := append(request.Messages, model.AIChatMessage{
		Role:    "assistant",
		Content: result.Message,
	})

	chatLogBytes, _ := json.Marshal(newHistory)
	var chatLogID uuid.UUID
	adminUUID, _ := uuid.Parse(adminID)

	if request.SessionID != "" {
		// Update existing
		parsedID, err := uuid.Parse(request.SessionID)
		if err == nil {
			existing, err := service.ChatLogRepository.FindByID(ctx, parsedID)
			if err == nil && existing.AdminID == adminUUID {
				existing.Messages = json.RawMessage(chatLogBytes)
				existing.UpdatedAt = time.Now()
				existing.Status = "active"
				if request.Topic != "" {
					existing.Topic = request.Topic
				}
				service.ChatLogRepository.Update(ctx, existing)
				chatLogID = existing.ChatLogID
			} else {
				// Fallback create new
				chatLogID = uuid.New()
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
					newLog.Topic = "New Chat " + time.Now().Format("15:04")
				}
				service.ChatLogRepository.Create(ctx, newLog)
			}
		}
	} else {
		// Create New
		chatLogID = uuid.New()
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
			newLog.Topic = "New Chat " + time.Now().Format("15:04")
		}
		service.ChatLogRepository.Create(ctx, newLog)
	}

	result.SessionID = chatLogID.String()

	// Store Generated Artifacts
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
		}
	}
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
	contextMsg += "\n\nReferensi contoh soal/dataset yang relevan (gunakan gaya serupa):\n"
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
