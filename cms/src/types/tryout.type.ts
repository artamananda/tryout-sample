import { BaseResponsePaginationProps } from "./config.type";

export interface TryoutProps {
  tryout_id: string;
  title: string;
  duration: number;
  token: string;
  start_time: Date | string;
  is_published: boolean;
  end_time: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface CreateTryoutRequest {
  title: string;
  duration: number;
  start_time: Date | string;
  end_time: Date | string;
  is_published: boolean;
  generate_from_bank_soal?: boolean;
  bank_soal_distribution?: Array<{
    type: string;
    count: number;
  }>;
}

export interface UpdateTryoutRequest {
  title?: string;
  duration?: number;
  start_time?: Date | string;
  end_time?: Date | string;
  is_published?: boolean;
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
