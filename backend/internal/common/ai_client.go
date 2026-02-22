package common

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"strings"
	"sync"
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

	// Rate limiting: enforce minimum delay between requests to avoid RPD/RPM limits
	mu          sync.Mutex
	lastRequest time.Time
	minDelay    time.Duration // minimum time between requests
	maxRetries  int           // max retries on rate limit (429) errors

	// Daily request counter to stay within RPD limits
	dailyCount int
	dailyLimit int       // max requests per day (0 = unlimited)
	dayStart   time.Time // when the current day started
}

// NewAIClient creates a new AI client based on config
// It reads AI_PROVIDER, GEMINI_API_KEY, OPENAI_API_KEY, AI_MODEL, AI_MODEL_VISION from config
func NewAIClient(configGet func(string) string) *AIClient {
	provider := strings.ToLower(configGet("AI_PROVIDER"))
	if provider == "" {
		provider = "gemini" // Default to gemini (free tier)
	}

	client := &AIClient{
		provider:   provider,
		maxRetries: 3,
	}

	switch provider {
	case "gemini":
		client.apiKey = configGet("GEMINI_API_KEY")
		client.model = configGet("AI_MODEL")
		if client.model == "" {
			client.model = "gemini-2.0-flash" // 2.0-flash has higher free tier RPD than 2.5
		}
		client.modelVision = configGet("AI_MODEL_VISION")
		if client.modelVision == "" {
			client.modelVision = "gemini-2.0-flash"
		}
		// Gemini supports OpenAI-compatible endpoint
		client.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai"
		// Gemini free tier: 5 RPM → enforce 15s between requests to stay safe
		client.minDelay = 15 * time.Second
		// Gemini free tier RPD is very low (~20 for 2.5-flash, higher for 2.0-flash)
		// Default daily limit, can be overridden via AI_DAILY_LIMIT env
		client.dailyLimit = 50

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
		client.minDelay = 1 * time.Second // OpenAI has higher rate limits

	default:
		log.Printf("[AIClient] Unknown provider '%s', falling back to gemini", provider)
		client.provider = "gemini"
		client.apiKey = configGet("GEMINI_API_KEY")
		client.model = "gemini-2.0-flash"
		client.modelVision = "gemini-2.0-flash"
		client.baseURL = "https://generativelanguage.googleapis.com/v1beta/openai"
		client.minDelay = 15 * time.Second
		client.dailyLimit = 50
	}

	// Allow overriding daily limit via env
	if dl := configGet("AI_DAILY_LIMIT"); dl != "" {
		if parsed, err := parseIntSafe(dl); err == nil && parsed > 0 {
			client.dailyLimit = parsed
		}
	}

	client.dayStart = time.Now()

	log.Printf("[AIClient] Initialized with provider=%s, model=%s, modelVision=%s, dailyLimit=%d", client.provider, client.model, client.modelVision, client.dailyLimit)
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

	// Check daily limit before making request
	if err := c.checkAndIncrementDaily(); err != nil {
		return nil, err
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

	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(math.Pow(3, float64(attempt))) * 10 * time.Second
			log.Printf("[AIClient] Vision rate limited, retrying in %v (attempt %d/%d)", backoff, attempt, c.maxRetries)
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
			}
		}

		c.waitForRateLimit(ctx)

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

		if resp.StatusCode == http.StatusTooManyRequests {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			lastErr = fmt.Errorf("rate limited (HTTP 429): %s", string(body))
			continue
		}

		result, err := c.parseResponse(resp)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		return result, nil
	}

	return nil, fmt.Errorf("AI vision request failed after %d retries: %w", c.maxRetries, lastErr)
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
	// Check daily limit before making request
	if err := c.checkAndIncrementDaily(); err != nil {
		return nil, err
	}

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

	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff: 10s, 30s, 90s
			backoff := time.Duration(math.Pow(3, float64(attempt))) * 10 * time.Second
			log.Printf("[AIClient] Rate limited, retrying in %v (attempt %d/%d)", backoff, attempt, c.maxRetries)
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
			}
		}

		// Wait for rate limiter
		c.waitForRateLimit(ctx)

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

		// Check for rate limit (429) → retry
		if resp.StatusCode == http.StatusTooManyRequests {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			lastErr = fmt.Errorf("rate limited (HTTP 429): %s", string(body))
			continue
		}

		result, err := c.parseResponse(resp)
		resp.Body.Close()
		if err != nil {
			return nil, err
		}
		return result, nil
	}

	return nil, fmt.Errorf("AI request failed after %d retries: %w", c.maxRetries, lastErr)
}

// waitForRateLimit enforces minimum delay between requests
func (c *AIClient) waitForRateLimit(ctx context.Context) {
	c.mu.Lock()
	elapsed := time.Since(c.lastRequest)
	if elapsed < c.minDelay {
		wait := c.minDelay - elapsed
		c.mu.Unlock()
		log.Printf("[AIClient] Rate limiting: waiting %v before next request", wait)
		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
		c.mu.Lock()
	}
	c.lastRequest = time.Now()
	c.mu.Unlock()
}

// checkAndIncrementDaily checks if we're within daily limit, resets if new day
// Returns error if daily limit exceeded
func (c *AIClient) checkAndIncrementDaily() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Reset counter if new day (past midnight)
	now := time.Now()
	if now.Day() != c.dayStart.Day() || now.Sub(c.dayStart) > 24*time.Hour {
		c.dailyCount = 0
		c.dayStart = now
		log.Printf("[AIClient] Daily counter reset (new day)")
	}

	if c.dailyLimit > 0 && c.dailyCount >= c.dailyLimit {
		return fmt.Errorf("daily request limit reached (%d/%d). Resets at midnight. Set AI_DAILY_LIMIT in .env to adjust",
			c.dailyCount, c.dailyLimit)
	}

	c.dailyCount++
	log.Printf("[AIClient] Request %d/%d today", c.dailyCount, c.dailyLimit)
	return nil
}

// GetDailyUsage returns current daily usage count and limit
func (c *AIClient) GetDailyUsage() (count int, limit int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.dailyCount, c.dailyLimit
}

func parseIntSafe(s string) (int, error) {
	n := 0
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return 0, fmt.Errorf("invalid number: %s", s)
		}
		n = n*10 + int(ch-'0')
	}
	return n, nil
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
