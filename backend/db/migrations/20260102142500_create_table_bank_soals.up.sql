CREATE TABLE IF NOT EXISTS bank_soals (
    bank_soal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    image_url TEXT,
    is_options BOOLEAN DEFAULT true,
    options TEXT[],
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty VARCHAR(20),
    topic VARCHAR(255),
    points INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
