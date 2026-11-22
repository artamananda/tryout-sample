DROP INDEX IF EXISTS users_phone_number_unique;

ALTER TABLE users
    DROP COLUMN IF EXISTS phone_number,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS birth_date,
    DROP COLUMN IF EXISTS last_education,
    DROP COLUMN IF EXISTS major,
    DROP COLUMN IF EXISTS target_agency,
    DROP COLUMN IF EXISTS target_position;
