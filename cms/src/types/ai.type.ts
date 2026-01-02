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
}

export interface GenerateQuestionsResponse {
  questions: GeneratedQuestion[];
}

// Chat types
export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  question_type?: string;
  mode: 'chat' | 'generate';
}

export interface AIChatResponse {
  message: string;
  questions?: GeneratedQuestion[];
  is_generating: boolean;
  suggestion?: string;
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
  type: string;
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  difficulty?: string;
  topic?: string;
  is_ai_generated: boolean;
  created_at: string;
}
