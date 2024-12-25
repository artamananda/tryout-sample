CREATE TABLE transaction_programs (
    transaction_program_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    program_id UUID NOT NULL,
    status VARCHAR(50),
    motivation TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (program_id) REFERENCES programs (program_id)
);
