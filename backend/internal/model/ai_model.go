package model

// GenerateQuestionsRequest represents the request for AI question generation
type GenerateQuestionsRequest struct {
	Topic             string `json:"topic" validate:"required"`
	QuestionType      string `json:"question_type" validate:"required"`
	NumberOfQuestions int    `json:"number_of_questions" validate:"required,min=1,max=20"`
	Difficulty        string `json:"difficulty" validate:"required,oneof=easy medium hard"`
	Context           string `json:"context"`
}

// GeneratedQuestion represents a single AI-generated question
type GeneratedQuestion struct {
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correct_answer"`
	Explanation   string   `json:"explanation"`
}

// GenerateQuestionsResponse represents the response from AI question generation
type GenerateQuestionsResponse struct {
	Questions []GeneratedQuestion `json:"questions"`
}

// AIChatMessage represents a single message in the chat
type AIChatMessage struct {
	Role        string   `json:"role"`    // "user" or "assistant"
	Content     string   `json:"content"` // message content
	ArtifactIDs []string `json:"artifact_ids,omitempty"`
}

// AIChatRequest represents a chat request to the AI
type AIChatRequest struct {
	SessionID      string          `json:"session_id"`
	Topic          string          `json:"topic"`
	Messages       []AIChatMessage `json:"messages" validate:"required"`
	QuestionType   string          `json:"question_type"`
	QuestionFormat string          `json:"question_format"`
	Mode           string          `json:"mode"`
}

type UpdateChatLogRequest struct {
	Topic string `json:"topic" validate:"required"`
}

type SaveAIExampleRequest struct {
	Topic   string `json:"topic" validate:"required"`
	Content string `json:"content" validate:"required"`
}

// AIChatResponse represents the AI's chat response
type AIChatResponse struct {
	SessionID     string              `json:"session_id"`
	Message       string              `json:"message"`
	Questions     []GeneratedQuestion `json:"questions,omitempty"`
	ArtifactIDs   []string            `json:"artifact_ids,omitempty"`
	IsGenerating  bool                `json:"is_generating"`
	Suggestion    string              `json:"suggestion,omitempty"`
	GeneratedFile string              `json:"generated_file,omitempty"`
}

// SaveChatLogRequest represents request to save chat for background processing
type SaveChatLogRequest struct {
	QuestionType string          `json:"question_type"`
	Topic        string          `json:"topic"`
	Messages     []AIChatMessage `json:"messages" validate:"required"`
}
