ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
    ADD COLUMN IF NOT EXISTS gender VARCHAR(10),
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS last_education VARCHAR(20),
    ADD COLUMN IF NOT EXISTS major VARCHAR(150),
    ADD COLUMN IF NOT EXISTS target_agency VARCHAR(150),
    ADD COLUMN IF NOT EXISTS target_position VARCHAR(150);

-- Satu nomor WhatsApp hanya boleh dipakai satu akun (dibutuhkan paket Perdana).
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_number_unique
    ON users (phone_number)
    WHERE phone_number IS NOT NULL AND phone_number <> '';
