import { message } from 'antd';
import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';

export interface LearningVideoResponse {
  id: number;
  title: string;
  url: string;
  program_id: string | null;
  program_name: string | null;
  created_at: string;
  updated_at: string;
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
  search: string = '',
  programId?: string
) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });

    if (search) params.append('search', search);
    if (programId) params.append('program_id', programId);

    const res = await httpRequest.get<
      BaseResponseProps<LearningVideoListResponse>
    >(process.env.REACT_APP_BASE_URL + '/learning-video?' + params.toString());
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'An error occurred';
    message.error(error);
  }
}

export async function apiGetLearningVideoById(id: number) {
  try {
    const res = await httpRequest.get<BaseResponseProps<LearningVideoResponse>>(
      process.env.REACT_APP_BASE_URL + '/learning-video/' + id
    );
    return res;
  } catch (err) {
    const error = err instanceof Error ? err.message : 'An error occurred';
    message.error(error);
  }
}
