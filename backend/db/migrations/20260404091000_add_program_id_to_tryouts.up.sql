ALTER TABLE tryouts
  ADD COLUMN IF NOT EXISTS program_id UUID;

ALTER TABLE tryouts
  ADD CONSTRAINT fk_tryouts_program_id
  FOREIGN KEY (program_id)
  REFERENCES programs(program_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tryouts_program_id ON tryouts(program_id);
