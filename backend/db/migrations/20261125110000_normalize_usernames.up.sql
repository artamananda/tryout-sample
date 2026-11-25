-- Username disimpan dalam huruf kecil dan unik (tanpa membedakan huruf besar/kecil).
--
-- 1. Username kembar (mis. "dzaki" dan "Dzaki"): akun yang paling dulu daftar
--    mempertahankan username-nya; akun lain mendapat username bawaan TELISIK
--    berpola <hewan>_<sifat>_<4 angka>, mis. "komodo_ceria_4821".
-- 2. Semua username lain diubah ke huruf kecil.
-- 3. Unique index menjaga agar tidak ada username kembar lagi.

DO $$
DECLARE
    animals TEXT[] := ARRAY[
        'komodo', 'anoa', 'badak', 'gajah', 'harimau', 'orangutan', 'cendrawasih',
        'jalak', 'merak', 'kakatua', 'pesut', 'tarsius', 'kancil', 'trenggiling',
        'beruang', 'rusa', 'penyu', 'lumba', 'kukang', 'elang', 'bekantan', 'maleo'
    ];
    moods TEXT[] := ARRAY[
        'ceria', 'gembira', 'semangat', 'santai', 'cerdas', 'tangguh', 'rajin',
        'jenaka', 'berani', 'sigap', 'ramah', 'tekun', 'lincah', 'bijak', 'kreatif'
    ];
    duplicate RECORD;
    candidate TEXT;
BEGIN
    FOR duplicate IN
        SELECT user_id
        FROM (
            SELECT user_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY LOWER(TRIM(username))
                       ORDER BY created_at NULLS LAST, user_id
                   ) AS position
            FROM users
        ) ranked
        WHERE position > 1
    LOOP
        LOOP
            candidate := animals[1 + FLOOR(RANDOM() * array_length(animals, 1))::INT]
                || '_' || moods[1 + FLOOR(RANDOM() * array_length(moods, 1))::INT]
                || '_' || LPAD(FLOOR(RANDOM() * 10000)::INT::TEXT, 4, '0');
            EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE LOWER(TRIM(username)) = candidate);
        END LOOP;

        RAISE NOTICE 'username kembar: user % sekarang %', duplicate.user_id, candidate;
        UPDATE users SET username = candidate, updated_at = NOW() WHERE user_id = duplicate.user_id;
    END LOOP;
END $$;

UPDATE users
SET username = LOWER(TRIM(username))
WHERE username <> LOWER(TRIM(username));

CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (LOWER(username));
