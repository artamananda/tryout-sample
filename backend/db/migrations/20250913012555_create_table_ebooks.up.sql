CREATE TABLE ebooks (
    ebook_id UUID PRIMARY KEY,
    title varchar(255) NOT NULL,
    author varchar(255) NOT NULL,
    description TEXT,
    publisher VARCHAR(255),
    publication_date DATE,
    isbn VARCHAR(13) UNIQUE,
    total_pages INT,
    is_published BOOLEAN DEFAULT FALSE,
    category VARCHAR(100),
    ebook_url varchar(255),
    cover_image_url varchar(255),
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
