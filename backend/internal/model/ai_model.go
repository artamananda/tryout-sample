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
