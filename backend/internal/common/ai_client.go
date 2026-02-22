package common

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

// ==================== AI Provider Configuration ====================
// Supported AI_PROVIDER values: "openai", "gemini"
//
// ENV variables:
//   AI_PROVIDER       = "gemini" (default) or "openai"
//   GEMINI_API_KEY    = your Google AI Studio API key (free tier available)
//   OPENAI_API_KEY    = your OpenAI API key (paid)
//   AI_MODEL          = override default model (optional)
//   AI_MODEL_VISION   = override default vision model (optional)
// ===================================================================

// AIMessage represents a single message in the conversation
type AIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// AIRequest represents a provider-agnostic AI chat request
type AIRequest struct {
	Messages    []AIMessage
	Temperature float64
	UseVision   bool // if true, use the vision-capable model
}

// AIResponse represents a provider-agnostic AI response
type AIResponse struct {
	Content string
}

// AIClient handles communication with AI providers (OpenAI or Gemini)
type AIClient struct {
	provider    string // "openai" or "gemini"
	apiKey      string
	model       string
	modelVision string
	baseURL     string
}

// NewAIClient creates a new AI client based on config
// It reads AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY, AI_MODEL, AI_MODEL_VISION from config
func NewAIClient(configGet func(string) string) *AIClient {
	provider := strings.ToLower(configGet("AI_PROVIDER"))
	if provider == "" {
		provider = "gemini" // Default to gemini (free tier)
	}

	client := &AIClient{
		provider: provider,
	}

	switch provider {
	case "gemini":
		client.apiKey = configGet("GEMINI_API_KEY")
		client.model = configGet("AI_MODEL")
		if client.model == "" {
			client.model = "gemini-2.5-flash"
		}
		client.modelVision = configGet("AI_MODEL_VISION")
		if client.modelVision == "" {
			client.modelVision = "gemini-2.5-flash"
		}
		// Gemini supports OpenAI-compatible endpoint
		client.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai"

	case "openai":
		client.apiKey = configGet("OPENAI_API_KEY")
		client.model = configGet("AI_MODEL")
		if client.model == "" {
			client.model = "gpt-4o-mini"
		}
		client.modelVision = configGet("AI_MODEL_VISION")
		if client.modelVision == "" {
			client.modelVision = "gpt-4o"
		}
		client.baseURL = "https://api.openai.com/v1"

	default:
		log.Printf("[AIClient] Unknown provider '%s', falling back to gemini", provider)
		client.provider = "gemini"
		client.apiKey = configGet("GEMINI_API_KEY")
		client.model = "gemini-2.5-flash"
		client.modelVision = "gemini-2.5-flash"
		client.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai"
	}

	log.Printf("[AIClient] Initialized with provider=%s, model=%s, modelVision=%s", client.provider, client.model, client.modelVision)
	return client
}

// GetProvider returns the current provider name
func (c *AIClient) GetProvider() string {
	return c.provider
}

// GetModel returns the current text model name
func (c *AIClient) GetModel() string {
	return c.model
}

// GetModelVision returns the current vision model name
func (c *AIClient) GetModelVision() string {
	return c.modelVision
}

// IsConfigured returns true if the API key is set
func (c *AIClient) IsConfigured() bool {
	return c.apiKey != ""
}

// Chat sends a text-only chat completion request
func (c *AIClient) Chat(ctx context.Context, req AIRequest) (*AIResponse, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("AI provider '%s' is not configured: API key missing. Set %s in .env",
			c.provider, c.getAPIKeyEnvName())
	}

	selectedModel := c.model
	if req.UseVision {
		selectedModel = c.modelVision
	}

	return c.callChatCompletion(ctx, selectedModel, req.Messages, req.Temperature, 120*time.Second)
}

// ChatWithVision sends a chat request with image content (for extraction_service)
// This uses the raw OpenAI-compatible format since vision needs special content structure
func (c *AIClient) ChatWithVision(ctx context.Context, messages []map[string]interface{}, temperature float64) (*AIResponse, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("AI provider '%s' is not configured: API key missing", c.provider)
	}

	type rawRequest struct {
		Model       string                   `json:"model"`
		Messages    []map[string]interface{} `json:"messages"`
		Temperature float64                  `json:"temperature,omitempty"`
	}

	payload := rawRequest{
		Model:       c.modelVision,
		Messages:    messages,
		Temperature: temperature,
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	c.setHeaders(httpReq)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("AI API request failed: %w", err)
	}
	defer resp.Body.Close()

	return c.parseResponse(resp)
}

// ==================== Internal methods ====================

type chatCompletionRequest struct {
	Model       string          `json:"model"`
	Messages    []chatMessage   `json:"messages"`
	Temperature float64         `json:"temperature,omitempty"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (c *AIClient) callChatCompletion(ctx context.Context, model string, messages []AIMessage, temperature float64, timeout time.Duration) (*AIResponse, error) {
	// Convert to API format
	var apiMessages []chatMessage
	for _, m := range messages {
		apiMessages = append(apiMessages, chatMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	payload := chatCompletionRequest{
		Model:       model,
		Messages:    apiMessages,
		Temperature: temperature,
	}

	reqBody, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}

	c.setHeaders(httpReq)

	client := &http.Client{Timeout: timeout}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("AI API request failed (%s): %w", c.provider, err)
	}
	defer resp.Body.Close()

	return c.parseResponse(resp)
}

func (c *AIClient) setHeaders(req *http.Request) {
	req.Header.Set("Content-Type", "application/json")

	// Both OpenAI and Gemini OpenAI-compatible endpoint use Bearer token
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
}

func (c *AIClient) parseResponse(resp *http.Response) (*AIResponse, error) {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// Check HTTP status first
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI API error (HTTP %d, provider=%s): %s", resp.StatusCode, c.provider, string(body))
	}

	var apiResp chatCompletionResponse
	if err := json.Unmarshal(body, &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	if apiResp.Error != nil {
		return nil, fmt.Errorf("AI API error (%s): %s", c.provider, apiResp.Error.Message)
	}

	if len(apiResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI (%s)", c.provider)
	}

	return &AIResponse{
		Content: apiResp.Choices[0].Message.Content,
	}, nil
}

func (c *AIClient) getAPIKeyEnvName() string {
	switch c.provider {
	case "gemini":
		return "GEMINI_API_KEY"
	case "openai":
		return "OPENAI_API_KEY"
	default:
		return "GEMINI_API_KEY"
	}
}

// CleanJSONContent extracts and cleans JSON from AI response content
func CleanJSONContent(content string) string {
	content = strings.TrimSpace(content)

	// Remove markdown code blocks
	content = strings.ReplaceAll(content, "```json", "")
	content = strings.ReplaceAll(content, "```", "")
	content = strings.TrimSpace(content)

	// Extract JSON object
	if start := strings.Index(content, "{"); start != -1 {
		if end := strings.LastIndex(content, "}"); end != -1 && end > start {
			return content[start : end+1]
		}
	}

	return content
}
