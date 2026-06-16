ALTER TABLE tryouts
  ADD COLUMN IF NOT EXISTS show_score BOOLEAN DEFAULT FALSE;

UPDATE tryouts
SET show_score = COALESCE(show_score, FALSE)
WHERE show_score IS NULL;
