DROP INDEX IF EXISTS users_verified_at_idx;

ALTER TABLE users
    DROP COLUMN IF EXISTS verified_by,
    DROP COLUMN IF EXISTS verified_at,
    DROP COLUMN IF EXISTS verified_label;
