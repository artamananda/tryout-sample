import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { BaseResponseProps } from "../types/config.type";

export interface EbookResponse {
  ebook_id: string;
  title: string;
  author: string;
  description: string;
  publisher: string;
  publication_date: string;
  isbn: string;
  total_pages: number;
  is_published: boolean;
  category: string;
  ebook_url: string;
  cover_image_url: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEbookRequest {
  title: string;
  author: string;
  description?: string;
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  total_pages?: number;
  is_published: boolean;
  category?: string;
  ebook_url?: string;
  cover_image_url?: string;
}

export interface UpdateEbookRequest {
  title?: string;
  author?: string;
  description?: string;
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  total_pages?: number;
  is_published?: boolean;
  category?: string;
  ebook_url?: string;
  cover_image_url?: string;
}

export async function apiGetEbooks(search?: string, isPublished?: boolean) {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (isPublished !== undefined) params.append("isPublished", String(isPublished));

    const res = await httpRequest.get<BaseResponseProps<{ count: number; results: EbookResponse[] }>>(
      `/ebook?${params.toString()}`
    );
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal memuat data ebook";
    message.error(error);
  }
}

export async function apiCreateEbook(data: CreateEbookRequest) {
  try {
    const res = await httpRequest.post<BaseResponseProps<EbookResponse>>("/ebook", data);
    if (res) message.success("Ebook berhasil dibuat");
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal membuat ebook";
    message.error(error);
    throw err;
  }
}

export async function apiUpdateEbook(id: string, data: UpdateEbookRequest) {
  try {
    const res = await httpRequest.put<BaseResponseProps<EbookResponse>>(`/ebook/${id}`, data);
    if (res) message.success("Ebook berhasil diperbarui");
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal memperbarui ebook";
    message.error(error);
    throw err;
  }
}

export async function apiDeleteEbook(id: string) {
  try {
    const res = await httpRequest.delete<BaseResponseProps<null>>(`/ebook/${id}`);
    if (res) message.success("Ebook berhasil dihapus");
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal menghapus ebook";
    message.error(error);
    throw err;
  }
}

export async function apiUploadEbookCover(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await httpRequest.put<BaseResponseProps<EbookResponse>>(
      `/ebook/${id}/upload-cover`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (res) message.success("Cover berhasil diunggah");
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal mengunggah cover";
    message.error(error);
    throw err;
  }
}

export async function apiUploadEbookFile(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await httpRequest.put<BaseResponseProps<EbookResponse>>(
      `/ebook/${id}/upload-file`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (res) message.success("File PDF berhasil diunggah");
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "Gagal mengunggah file PDF";
    message.error(error);
    throw err;
  }
}
