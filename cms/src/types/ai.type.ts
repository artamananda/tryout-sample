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
