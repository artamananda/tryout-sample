CREATE TABLE IF NOT EXISTS user_otp (
    email VARCHAR(255) PRIMARY KEY,
    otp CHAR(6) NOT NULL,
    expired_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
