CREATE TABLE IF NOT EXISTS tryout_result_caches (
    tryout_id UUID PRIMARY KEY,
    payload JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tryout_result_caches_tryout_id
      FOREIGN KEY (tryout_id)
      REFERENCES tryouts(tryout_id)
      ON DELETE CASCADE
);
