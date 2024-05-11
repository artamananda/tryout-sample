CREATE TABLE IF NOT EXISTS transaction_tryouts (
    transaction_tryout_id UUID PRIMARY KEY,
    tryout_id UUID,
    user_id UUID,
    status VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
