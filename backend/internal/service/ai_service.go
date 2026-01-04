package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
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
		formatInstruction := "Provide 5 options (Multiple Choice). 'correct_answer' is a single letter (e.g. 'A')."
		if request.QuestionFormat == "essay" {
			formatInstruction = "Provide NO options (leave empty array). 'correct_answer' field should contain the model answer or grading rubric."
		} else if request.QuestionFormat == "multiple_answer" {
			formatInstruction = "Provide 5 options. 'correct_answer' should list all correct options (e.g. 'A, C')."
		} else if request.QuestionFormat == "short_answer" {
			formatInstruction = "Provide NO options (leave empty array). 'correct_answer' is the short answer key."
		}

		systemMessage = `You are an expert exam question creator assistant.

When you receive a request to generate questions:
1. Generate the questions in the format requested: ` + formatInstruction + `
2. Return a JSON response like this:
{
  "message": "I've generated N questions about [topic].",
  "is_generating": true,
  "questions": [
    {
      "text": "Question text?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct_answer": "A",
      "explanation": "Why A is correct",
      "type": "` + request.QuestionFormat + `"
    }
  ]
}

Always respond with valid JSON only. Do not wrap code in markdown blocks.`
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
	systemPrompt := "You are an expert exam question editor. Update the following question based on the user's instruction. Output ONLY the updated question in JSON format."
	userPrompt := fmt.Sprintf("Original Question JSON: %s\n\nInstruction: %s\n\nOutput JSON:", artifact.Content, instruction)

	// Call OpenAI (Copy logic from Chat or make helper? Copy for speed)
	req := model.OpenAIChatRequest{
		Model: "gpt-4o", // Use high quality
		Messages: []model.OpenAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.7,
	}

	reqBody, _ := json.Marshal(req)
	client := &http.Client{Timeout: 60 * time.Second}
	openAIReq, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	openAIReq.Header.Set("Content-Type", "application/json")
	openAIReq.Header.Set("Authorization", "Bearer "+service.Config.Get("OPENAI_API_KEY"))

	resp, err := client.Do(openAIReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var openAIResp model.OpenAIChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, err
	}
	if len(openAIResp.Choices) == 0 {
		return nil, errors.New("no response from AI")
	}

	// Parse content (interface{} -> string)
	var contentStr string
	if cStr, ok := openAIResp.Choices[0].Message.Content.(string); ok {
		contentStr = cStr
	} else {
		// Handle unexpected content (unlikely for gpt-4o text generation, but safety check)
		return nil, errors.New("unexpected content format from AI")
	}

	jsonContent := service.extractJSON(contentStr)

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
