import { BaseResponsePaginationProps } from "./config.type";

export interface TryoutResultParticipant {
  user_id: string;
  name: string;
}

export interface TryoutResultAnswerRow {
  question_id: string;
  local_id: number;
  subtest: string;
  marks: Record<string, string>;
}

export interface TryoutResultScoreRow {
  subtest: string;
  scores: Record<string, number>;
}

export interface TryoutResultUserSummary {
  user_id: string;
  name: string;
  subtest_scores: Record<string, number>;
  total_score: number;
  avg_score: number;
}

export interface TryoutResultPayload {
  tryout_id: string;
  generated_at: string;
  participants: TryoutResultParticipant[];
  result_rows: TryoutResultAnswerRow[];
  score_rows: TryoutResultScoreRow[];
  user_summary: TryoutResultUserSummary[];
}

export interface FetchTryoutResultResponse extends BaseResponsePaginationProps<TryoutResultPayload> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: TryoutResultPayload[];
  };
}
