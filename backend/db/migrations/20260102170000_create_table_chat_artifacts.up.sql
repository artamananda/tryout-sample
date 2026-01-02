CREATE TABLE chat_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_log_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'question',
    content JSONB NOT NULL,
    references_data JSONB,
    metadata JSONB,
    user_feedback TEXT,
    status VARCHAR(50) DEFAULT 'generated',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_log FOREIGN KEY (chat_log_id) REFERENCES chat_logs(chat_log_id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_artifacts_chat_log ON chat_artifacts(chat_log_id);
