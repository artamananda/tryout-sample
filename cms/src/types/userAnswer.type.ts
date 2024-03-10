import { BaseResponsePaginationProps } from "./config.type";

export interface UserAnswerProps {
  user_answer_id: string;
  user_id: string;
  tryout_id: string;
  question_id: string;
  user_answer: string;
}

export interface FetchAllUserAnswerResponse
  extends BaseResponsePaginationProps<UserAnswerProps> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: UserAnswerProps[];
  };
}
