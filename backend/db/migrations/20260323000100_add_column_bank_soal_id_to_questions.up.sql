ALTER TABLE questions
ADD COLUMN IF NOT EXISTS bank_soal_id UUID REFERENCES bank_soals(bank_soal_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_questions_bank_soal_id ON questions(bank_soal_id);
