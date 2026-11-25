-- Lencana centang biru "Terverifikasi", hanya diberikan admin
-- (owner, tutor, atau siswa berprestasi).
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS verified_label VARCHAR(20),
    ADD COLUMN IF NOT EXISTS verified_at    TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS verified_by    UUID REFERENCES users (user_id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_verified_at_idx ON users (verified_at) WHERE verified_at IS NOT NULL;
