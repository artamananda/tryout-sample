CREATE TABLE IF NOT EXISTS system_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT DEFAULT '',
    description TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO system_configs (key, value, description) VALUES
    ('llm_utbk_provider', '', 'AI Provider untuk Bank Soal UTBK (gemini/openai). Kosongkan untuk pakai .env'),
    ('llm_utbk_api_key', '', 'API Key untuk Bank Soal UTBK. Kosongkan untuk pakai .env'),
    ('llm_utbk_model', '', 'AI Model untuk Bank Soal UTBK (opsional, contoh: gemini-2.5-flash)'),
    ('llm_skd_provider', '', 'AI Provider untuk Bank Soal SKD CPNS (gemini/openai)'),
    ('llm_skd_api_key', '', 'API Key untuk Bank Soal SKD CPNS'),
    ('llm_skd_model', '', 'AI Model untuk Bank Soal SKD CPNS (opsional, contoh: gemini-2.5-flash)')
ON CONFLICT (key) DO NOTHING;
