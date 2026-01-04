ALTER TABLE bank_soals DROP COLUMN IF EXISTS status;
ALTER TABLE bank_soals DROP COLUMN IF EXISTS similarity_score;
ALTER TABLE bank_soals DROP COLUMN IF EXISTS similar_to_id;
ALTER TABLE bank_soals DROP COLUMN IF EXISTS processed_by_cron;
ALTER TABLE bank_soals DROP COLUMN IF EXISTS published_at;

DROP INDEX IF EXISTS idx_bank_soals_status;
