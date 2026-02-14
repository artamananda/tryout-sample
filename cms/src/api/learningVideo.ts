import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { BaseResponseProps } from "../types/config.type";

export interface LearningVideoResponse {
  id: number;
  title: string;
  url: string;
  program_id: string | null;
  program_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLearningVideoRequest {
  title: string;
  url: string;
  program_id?: string;
}

export interface UpdateLearningVideoRequest {
  title?: string;
  url?: string;
  program_id?: string | null;
}

export interface LearningVideoListResponse {
  data: LearningVideoResponse[];
  total: number;
  page: number;
  page_size: number;
  total_page: number;
}

export async function apiGetLearningVideos(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  programId?: string,
) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });

    if (search) params.append("search", search);
    if (programId) params.append("program_id", programId);

    const res = await httpRequest.get<
      BaseResponseProps<LearningVideoListResponse>
    >(import.meta.env.VITE_BASE_URL + "/learning-video?" + params.toString());
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "An error occurred";
    message.error(error);
  }
}

export async function apiGetLearningVideoById(id: number) {
  try {
    const res = await httpRequest.get<BaseResponseProps<LearningVideoResponse>>(
      import.meta.env.VITE_BASE_URL + "/learning-video/" + id,
    );
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "An error occurred";
    message.error(error);
  }
}

export async function apiCreateLearningVideo(data: CreateLearningVideoRequest) {
  try {
    const res = await httpRequest.post<
      BaseResponseProps<LearningVideoResponse>
    >(import.meta.env.VITE_BASE_URL + "/learning-video", data);

    if (res) {
      message.success("Learning video created successfully");
    }
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "An error occurred";
    message.error(error);
  }
}

export async function apiUpdateLearningVideo(
  id: number,
  data: UpdateLearningVideoRequest,
) {
  try {
    const res = await httpRequest.put<BaseResponseProps<LearningVideoResponse>>(
      import.meta.env.VITE_BASE_URL + "/learning-video/" + id,
      data,
    );

    if (res) {
      message.success("Learning video updated successfully");
    }
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "An error occurred";
    message.error(error);
  }
}

export async function apiDeleteLearningVideo(id: number) {
  try {
    const res = await httpRequest.delete<BaseResponseProps<null>>(
      import.meta.env.VITE_BASE_URL + "/learning-video/" + id,
    );

    if (res) {
      message.success("Learning video deleted successfully");
    }
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : "An error occurred";
    message.error(error);
  }
}
