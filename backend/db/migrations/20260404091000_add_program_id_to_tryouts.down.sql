DROP INDEX IF EXISTS idx_tryouts_program_id;

ALTER TABLE tryouts
  DROP CONSTRAINT IF EXISTS fk_tryouts_program_id;

ALTER TABLE tryouts
  DROP COLUMN IF EXISTS program_id;
