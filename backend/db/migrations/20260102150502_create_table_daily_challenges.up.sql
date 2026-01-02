CREATE TABLE IF NOT EXISTS daily_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_date DATE UNIQUE NOT NULL,
    question_ids UUID[] NOT NULL,
    title VARCHAR(255),
    description TEXT,
    bonus_points INT DEFAULT 10,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(challenge_date);
