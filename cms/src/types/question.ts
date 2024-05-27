export interface QuestionProps {
  question_id: string;
  tryout_id: string;
  local_id?: number;
  is_options?: boolean;
  type: string;
  text: string;
  options: string[];
  image_url?: string;
  correct_answer: string;
  points?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateQuestionRequest {
  tryout_id: string;
  local_id?: number;
  type: string;
  text: string;
  options: string[];
  image_url?: string;
  correct_answer: string;
  points?: string;
  is_options?: boolean;
}

export interface UpdateQuestionRequest {
  question_id: string;
  tryout_id: string;
  local_id?: number;
  type?: string;
  text?: string;
  options?: string[];
  image_url?: string;
  correct_answer?: string;
  points?: string;
}
