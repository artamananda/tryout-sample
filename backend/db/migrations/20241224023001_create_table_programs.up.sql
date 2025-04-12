CREATE TABLE programs (
    program_id UUID PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    max_participants INT,
    is_published BOOLEAN,
    picture_url VARCHAR(255),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    open_registration TIMESTAMPTZ,
    close_registration TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
