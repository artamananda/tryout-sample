CREATE TABLE IF NOT EXISTS question_statistics (
    stat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_soal_id UUID NOT NULL REFERENCES bank_soals(bank_soal_id) ON DELETE CASCADE,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    avg_time_seconds FLOAT,
    calculated_difficulty VARCHAR(20),
    last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_question_statistics_bank_soal ON question_statistics(bank_soal_id);
