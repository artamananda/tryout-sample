CREATE TABLE IF NOT EXISTS chat_logs (
    chat_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    question_type VARCHAR(50),
    topic VARCHAR(255),
    messages JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_logs_status ON chat_logs(status);
CREATE INDEX idx_chat_logs_admin_id ON chat_logs(admin_id);
