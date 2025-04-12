CREATE TABLE users_answers (
    user_answer_id UUID PRIMARY KEY,
    user_id UUID,
    tryout_id UUID,
    question_id UUID,
    user_answer TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
