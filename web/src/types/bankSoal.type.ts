import { QuestionProps } from './question';

export interface BankSoalFilter {
  questionType?: string;
  difficulty?: string;
  search?: string;
}

export interface BankSoalQuestionProps extends QuestionProps {
  tryout_title?: string;
}
