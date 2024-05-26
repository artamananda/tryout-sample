export interface TransactionTryoutProps {
  transaction_tryout_id: string;
  tryout_id: string;
  user_id: string;
  status: string;
  start_time?: Date | string;
  end_time?: Date | string;
  token?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CreateTransactionTryoutRequest {
    tryout_id: string;
    user_id: string;
  }

export interface UpdateTransactionTryoutRequest {
    tryout_id: string;
    user_id: string;
    token?: string;
  }
