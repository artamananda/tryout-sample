-- Paket kelas per gelombang (program). Satu program = satu gelombang.
CREATE TABLE IF NOT EXISTS packages (
    package_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id          UUID NOT NULL REFERENCES programs (program_id),
    code                VARCHAR(30)  NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT         NOT NULL DEFAULT '',
    price               INTEGER      NOT NULL DEFAULT 0 CHECK (price >= 0),
    launch_price        INTEGER CHECK (launch_price >= 0),
    launch_price_until  TIMESTAMPTZ,
    normal_value        INTEGER      NOT NULL DEFAULT 0 CHECK (normal_value >= 0),
    tryout_count        INTEGER      NOT NULL DEFAULT 0 CHECK (tryout_count >= 0),
    class_count         INTEGER      NOT NULL DEFAULT 0 CHECK (class_count >= 0),
    recording_days      INTEGER      NOT NULL DEFAULT 0 CHECK (recording_days >= 0),
    mentoring_sessions  INTEGER      NOT NULL DEFAULT 0 CHECK (mentoring_sessions >= 0),
    has_explanation     BOOLEAN      NOT NULL DEFAULT TRUE,
    has_weekly_report   BOOLEAN      NOT NULL DEFAULT FALSE,
    has_study_group     BOOLEAN      NOT NULL DEFAULT FALSE,
    has_certificate     BOOLEAN      NOT NULL DEFAULT FALSE,
    features            TEXT[]       NOT NULL DEFAULT '{}',
    quota               INTEGER CHECK (quota > 0),
    badge               VARCHAR(50)  NOT NULL DEFAULT '',
    sort_order          INTEGER      NOT NULL DEFAULT 0,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (program_id, code)
);

-- Pesanan paket. Pembayaran dibuat lewat API bridge Midtrans milik bisnis lain,
-- lalu bridge memanggil callback sistem ini.
CREATE TABLE IF NOT EXISTS orders (
    order_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(40)  NOT NULL UNIQUE,
    user_id             UUID         NOT NULL REFERENCES users (user_id),
    package_id          UUID         NOT NULL REFERENCES packages (package_id),
    program_id          UUID         NOT NULL REFERENCES programs (program_id),
    amount              INTEGER      NOT NULL CHECK (amount >= 0),
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    phone_number        VARCHAR(20)  NOT NULL DEFAULT '',
    payment_provider    VARCHAR(30)  NOT NULL DEFAULT '',
    payment_token       TEXT         NOT NULL DEFAULT '',
    payment_url         TEXT         NOT NULL DEFAULT '',
    payment_method      VARCHAR(50)  NOT NULL DEFAULT '',
    provider_reference  VARCHAR(100) NOT NULL DEFAULT '',
    last_callback       JSONB,
    expires_at          TIMESTAMPTZ,
    paid_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_package_status_idx ON orders (package_id, status);
-- Paket gratis (Perdana) hanya sekali per nomor WhatsApp.
CREATE UNIQUE INDEX IF NOT EXISTS orders_free_package_phone_unique
    ON orders (package_id, phone_number)
    WHERE amount = 0 AND status = 'PAID' AND phone_number <> '';

-- Paket yang sedang dimiliki peserta di sebuah program.
ALTER TABLE transaction_programs
    ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages (package_id);

-- TO ke-berapa dalam program, dan cara penilaiannya.
ALTER TABLE tryouts
    ADD COLUMN IF NOT EXISTS sequence INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS scoring_mode VARCHAR(10) NOT NULL DEFAULT 'irt';

-- Bobot tiap opsi (TKP 1-5) dan pembahasan tertulis.
ALTER TABLE bank_soals
    ADD COLUMN IF NOT EXISTS option_scores INTEGER[];
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS option_scores INTEGER[],
    ADD COLUMN IF NOT EXISTS explanation TEXT NOT NULL DEFAULT '';

-- Pemeriksaan nomor WhatsApp (diisi saat metode verifikasi sudah dipilih).
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
