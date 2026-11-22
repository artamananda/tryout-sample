-- Pengaturan tambahan per paket: fee tutor, grup belajar, garansi.
ALTER TABLE packages
    ADD COLUMN IF NOT EXISTS tutor_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (tutor_fee_percent >= 0 AND tutor_fee_percent <= 100),
    ADD COLUMN IF NOT EXISTS mentoring_fee     INTEGER      NOT NULL DEFAULT 0 CHECK (mentoring_fee >= 0),
    ADD COLUMN IF NOT EXISTS study_group_url   TEXT         NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS has_guarantee     BOOLEAN      NOT NULL DEFAULT FALSE;

-- Kelas pembahasan live. Kelas ke-k biasanya membahas TO ke-k.
CREATE TABLE IF NOT EXISTS live_classes (
    class_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id    UUID         NOT NULL REFERENCES programs (program_id),
    sequence      INTEGER      NOT NULL CHECK (sequence > 0),
    title         VARCHAR(150) NOT NULL,
    description   TEXT         NOT NULL DEFAULT '',
    tryout_id     UUID REFERENCES tryouts (tryout_id) ON DELETE SET NULL,
    tutor_name    VARCHAR(100) NOT NULL DEFAULT '',
    starts_at     TIMESTAMPTZ  NOT NULL,
    ends_at       TIMESTAMPTZ  NOT NULL,
    meeting_url   TEXT         NOT NULL DEFAULT '',
    recording_url TEXT         NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (program_id, sequence),
    CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS live_class_attendances (
    class_id  UUID        NOT NULL REFERENCES live_classes (class_id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users (user_id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, user_id)
);

CREATE TABLE IF NOT EXISTS live_class_ratings (
    class_id   UUID        NOT NULL REFERENCES live_classes (class_id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users (user_id),
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT        NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, user_id)
);

-- Slot mentoring 1:1 (Platinum).
CREATE TABLE IF NOT EXISTS mentoring_slots (
    slot_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id       UUID         NOT NULL REFERENCES programs (program_id),
    tutor_name       VARCHAR(100) NOT NULL,
    starts_at        TIMESTAMPTZ  NOT NULL,
    duration_minutes INTEGER      NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
    meeting_url      TEXT         NOT NULL DEFAULT '',
    status           VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    booked_by        UUID REFERENCES users (user_id),
    booked_at        TIMESTAMPTZ,
    notes            TEXT         NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (program_id, tutor_name, starts_at)
);
CREATE INDEX IF NOT EXISTS mentoring_slots_booked_by_idx ON mentoring_slots (booked_by);

-- Program rujukan.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS referral_code VARCHAR(12);
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_unique ON users (referral_code) WHERE referral_code IS NOT NULL;

ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS list_price              INTEGER     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount                INTEGER     NOT NULL DEFAULT 0 CHECK (discount >= 0),
    ADD COLUMN IF NOT EXISTS referral_code           VARCHAR(12) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS referrer_user_id        UUID REFERENCES users (user_id),
    ADD COLUMN IF NOT EXISTS upgrade_from_package_id UUID REFERENCES packages (package_id);

ALTER TABLE transaction_programs
    ADD COLUMN IF NOT EXISTS bonus_tryouts INTEGER NOT NULL DEFAULT 0 CHECK (bonus_tryouts >= 0);

CREATE TABLE IF NOT EXISTS referral_rewards (
    order_id         UUID PRIMARY KEY REFERENCES orders (order_id),
    referrer_user_id UUID        NOT NULL REFERENCES users (user_id),
    program_id       UUID        NOT NULL REFERENCES programs (program_id),
    bonus_tryouts    INTEGER     NOT NULL DEFAULT 0,
    note             TEXT        NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Email progres mingguan: satu baris per peserta per program per minggu.
CREATE TABLE IF NOT EXISTS weekly_report_logs (
    user_id    UUID        NOT NULL REFERENCES users (user_id),
    program_id UUID        NOT NULL REFERENCES programs (program_id),
    week_start DATE        NOT NULL,
    status     VARCHAR(20) NOT NULL,
    error      TEXT        NOT NULL DEFAULT '',
    sent_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, program_id, week_start)
);

-- Garansi naik kelas.
CREATE TABLE IF NOT EXISTS guarantee_claims (
    claim_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users (user_id),
    program_id        UUID        NOT NULL REFERENCES programs (program_id),
    package_id        UUID        NOT NULL REFERENCES packages (package_id),
    first_score       INTEGER     NOT NULL,
    last_score        INTEGER     NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    target_program_id UUID REFERENCES programs (program_id),
    admin_note        TEXT        NOT NULL DEFAULT '',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, program_id)
);

-- Sertifikat.
CREATE TABLE IF NOT EXISTS certificates (
    certificate_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_number VARCHAR(40) NOT NULL UNIQUE,
    user_id            UUID        NOT NULL REFERENCES users (user_id),
    program_id         UUID        NOT NULL REFERENCES programs (program_id),
    package_id         UUID        NOT NULL REFERENCES packages (package_id),
    best_score         INTEGER     NOT NULL DEFAULT 0,
    tryouts_completed  INTEGER     NOT NULL DEFAULT 0,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, program_id)
);
