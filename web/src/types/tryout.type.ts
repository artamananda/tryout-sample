import { BaseResponsePaginationProps } from './config.type';

export interface TryoutProps {
  tryout_id: string;
  program_id?: string;
  title: string;
  duration: number;
  start_time: Date | string;
  end_time: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
  token: string;
  show_score?: boolean;
  sequence?: number;
  scoring_mode?: 'irt' | 'skd' | string;
  has_access?: boolean;
  locked_reason?: string;
}

export interface FetchAllTryoutsResponse extends BaseResponsePaginationProps<TryoutProps> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: TryoutProps[];
  };
}
