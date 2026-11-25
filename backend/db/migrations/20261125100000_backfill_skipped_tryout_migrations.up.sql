-- Susulan untuk database yang melewatkan tiga migrasi 20260404* (file itu masuk
-- lewat merge setelah database sudah di versi 20260531000001, dan golang-migrate
-- tidak pernah menjalankan versi yang lebih tua dari versi database).
-- Semua perintah aman diulang: di database yang sudah lengkap tidak mengubah apa pun.

-- = 20260404091000_add_program_id_to_tryouts
ALTER TABLE tryouts
  ADD COLUMN IF NOT EXISTS program_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tryouts_program_id') THEN
    ALTER TABLE tryouts
      ADD CONSTRAINT fk_tryouts_program_id
      FOREIGN KEY (program_id) REFERENCES programs(program_id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tryouts_program_id ON tryouts(program_id);

-- = 20260404092000_create_table_tryout_result_caches
CREATE TABLE IF NOT EXISTS tryout_result_caches (
    tryout_id UUID PRIMARY KEY,
    payload JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tryout_result_caches_tryout_id
      FOREIGN KEY (tryout_id)
      REFERENCES tryouts(tryout_id)
      ON DELETE CASCADE
);

-- = 20260404093000_add_column_show_score_to_tryouts
ALTER TABLE tryouts
  ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT FALSE;

UPDATE tryouts
SET show_score = FALSE
WHERE show_score IS NULL;
