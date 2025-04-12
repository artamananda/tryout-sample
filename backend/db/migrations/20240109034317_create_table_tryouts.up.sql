CREATE TABLE IF NOT EXISTS tryouts (
    tryout_id UUID PRIMARY KEY,
    title VARCHAR(255),
    duration INTEGER,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
