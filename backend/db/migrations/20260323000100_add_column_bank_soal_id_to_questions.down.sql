DROP INDEX IF EXISTS idx_questions_bank_soal_id;

ALTER TABLE questions
DROP COLUMN IF EXISTS bank_soal_id;
