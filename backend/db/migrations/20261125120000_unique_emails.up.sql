-- Email disimpan dalam huruf kecil dan unik (login memakai email).
--
-- 1. Email ganda: akun yang paling baru dipakai login dipertahankan (lalu yang
--    paling dulu daftar). Akun lain diberi email penanda yang tidak bisa
--    menerima email, duplikat-<8 karakter id>@telisik.invalid, supaya datanya
--    tetap ada dan admin bisa menggabungkan atau menghapusnya nanti.
-- 2. Semua email diubah ke huruf kecil tanpa spasi.
-- 3. Unique index menjaga agar tidak ada email ganda lagi.

DO $$
DECLARE
    duplicate RECORD;
BEGIN
    FOR duplicate IN
        SELECT user_id, email
        FROM (
            SELECT user_id, email,
                   ROW_NUMBER() OVER (
                       PARTITION BY LOWER(TRIM(email))
                       ORDER BY last_login DESC NULLS LAST, created_at NULLS LAST, user_id
                   ) AS position
            FROM users
        ) ranked
        WHERE position > 1
    LOOP
        RAISE NOTICE 'email ganda: user % (%) sekarang duplikat-%@telisik.invalid',
            duplicate.user_id, duplicate.email, LEFT(duplicate.user_id::TEXT, 8);
        UPDATE users
        SET email = 'duplikat-' || LEFT(user_id::TEXT, 8) || '@telisik.invalid',
            updated_at = NOW()
        WHERE user_id = duplicate.user_id;
    END LOOP;
END $$;

UPDATE users
SET email = LOWER(TRIM(email))
WHERE email <> LOWER(TRIM(email));

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (LOWER(email));
