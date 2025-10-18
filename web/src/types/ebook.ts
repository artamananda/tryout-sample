export interface EbookProps {
  ebook_id: string;
  title: string;
  author: string;
  description: string;
  publisher: string;
  publication_date: Date | string;
  isbn: string;
  total_pages: number;
  is_published: boolean;
  category: string;
  ebook_url: string;
  cover_image_url: string;
  created_at: Date | string;
  updated_at: Date | string;
}
