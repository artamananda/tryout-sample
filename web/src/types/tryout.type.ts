import { BaseResponsePaginationProps } from './config.type';

export interface TryoutProps {
  tryout_id: string;
  title: string;
  duration: number;
  start_time: Date | string;
  end_time: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface FetchAllTryoutsResponse
  extends BaseResponsePaginationProps<TryoutProps> {
  code: string;
  message: string;
  payload: {
    count: number;
    prev: string;
    next: string;
    results: TryoutProps[];
  };
}
