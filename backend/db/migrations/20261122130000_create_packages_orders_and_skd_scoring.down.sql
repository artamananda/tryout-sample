ALTER TABLE users DROP COLUMN IF EXISTS phone_verified_at;
ALTER TABLE questions DROP COLUMN IF EXISTS option_scores, DROP COLUMN IF EXISTS explanation;
ALTER TABLE bank_soals DROP COLUMN IF EXISTS option_scores;
ALTER TABLE tryouts DROP COLUMN IF EXISTS sequence, DROP COLUMN IF EXISTS scoring_mode;
ALTER TABLE transaction_programs DROP COLUMN IF EXISTS package_id;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS packages;
