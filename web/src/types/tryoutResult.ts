import { BaseResponsePaginationProps } from './config.type';

export interface UserTryoutResultDetail {
  tryout_id: string;
  user_id: string;
  name: string;
  generated_at: Date | string;
  subtest_scores: Record<string, number>;
  total_score: number;
  avg_score: number;
}

export interface FetchMyTryoutResultResponse extends BaseResponsePaginationProps<UserTryoutResultDetail> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: UserTryoutResultDetail[];
  };
}
