CREATE TABLE IF NOT EXISTS options (
    option_id UUID PRIMARY KEY,
    question_id UUID,
    text TEXT,
    FOREIGN KEY (question_id) REFERENCES questions(question_id)
);
