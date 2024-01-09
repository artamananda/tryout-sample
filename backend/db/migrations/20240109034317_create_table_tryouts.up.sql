CREATE TABLE IF NOT EXISTS tryouts (
    tryout_id UUID PRIMARY KEY,
    title VARCHAR(255),
    duration INTEGER,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
