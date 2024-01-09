CREATE TABLE IF NOT EXISTS questions (
    question_id UUID PRIMARY KEY,
    tryout_id UUID,
    text TEXT,
    correct_answer VARCHAR(255),
    points INTEGER,
    FOREIGN KEY (tryout_id) REFERENCES tryouts(tryout_id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
