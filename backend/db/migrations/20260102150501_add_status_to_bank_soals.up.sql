ALTER TABLE bank_soals ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE bank_soals ADD COLUMN IF NOT EXISTS similarity_score FLOAT;
ALTER TABLE bank_soals ADD COLUMN IF NOT EXISTS similar_to_id UUID;
ALTER TABLE bank_soals ADD COLUMN IF NOT EXISTS processed_by_cron BOOLEAN DEFAULT false;
ALTER TABLE bank_soals ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;

CREATE INDEX idx_bank_soals_status ON bank_soals(status);
