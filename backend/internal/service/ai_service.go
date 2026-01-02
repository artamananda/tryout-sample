package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/artamananda/tryout-sample/internal/common"
	"github.com/artamananda/tryout-sample/internal/config"
	"github.com/artamananda/tryout-sample/internal/exception"
	"github.com/artamananda/tryout-sample/internal/model"
)

type AIService struct {
	Config config.Config
}

func NewAIService(cfg config.Config) AIService {
	return AIService{
		Config: cfg,
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
