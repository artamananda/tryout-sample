export interface QuestionProps {
  question_id: string;
  tryout_id: string;
  type: string;
  text: string;
  options: string[];
  correct_answer: string;
  points?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateQuestionRequest {
  tryout_id: string;
  type: string;
  text: string;
  options: string[];
  correct_answer: string;
  points?: string;
}

export interface UpdateQuestionRequest {
  question_id: string;
  tryout_id: string;
  type?: string;
  text?: string;
  options?: string[];
  correct_answer?: string;
  points?: string;
}
