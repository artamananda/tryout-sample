export interface GenerateQuestionsRequest {
  topic: string;
  question_type: string;
  number_of_questions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  context?: string;
}

export interface GeneratedQuestion {
  text: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  type?: string; 
  metadata?: { source: string };
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
}

// Chat types
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  questions?: GeneratedQuestion[];
  artifact_ids?: string[];
}

export interface AIChatRequest {
  session_id?: string;
  topic?: string;
  messages: AIChatMessage[];
  question_type?: string;
  question_format?: string;
  mode: 'chat' | 'generate';
}

export interface AIChatResponse {
  session_id: string;
  message: string;
  questions?: GeneratedQuestion[];
  artifact_ids?: string[];
  is_generating: boolean;
  suggestion?: string;
}

export interface ChatLog {
  chat_log_id: string;
  admin_id: string;
  question_type: string;
  topic: string;
  messages: AIChatMessage[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SaveAIExampleRequest {
	Topic: string;
	Content: string;
}

export interface ChatArtifact {
  id: string;
  chat_log_id: string;
  type: string;
  content: GeneratedQuestion;
  references_data?: { topic: string; content: string }[];
  metadata?: { source: string };
  user_feedback?: string;
  status: string;
  created_at: string;
}

export interface SaveChatLogRequest {
  question_type: string;
  topic: string;
  messages: AIChatMessage[];
}

// Bank Soal types
export interface CreateBankSoalRequest {
  type: string;
  text: string;
  image_url?: string;
  is_options?: boolean;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  points?: number;
  is_ai_generated: boolean;
}

export interface CreateBankSoalBatchRequest {
  questions: CreateBankSoalRequest[];
}

export interface BankSoalResponse {
  bank_soal_id: string;
  question_id?: string; // alias for bank_soal_id in some contexts
  type: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  image_url?: string;
  is_ai_generated: boolean;
  created_at: string;
}
