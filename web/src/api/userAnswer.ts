import { httpRequest } from '../helpers/api';
import { BaseResponseProps } from '../types/config.type';

export const sendAnswer = async (data: {
  user_id: string;
  tryout_id: string;
  question_id: string;
  user_answer: string;
}) => {
  try {
    const res = await httpRequest.post<BaseResponseProps<any>>(
      import.meta.env.VITE_BASE_URL + '/user-answer',
      data
    );
    if (res) {
    }
    return false;
  } catch (err) {}
};

export const putAnswer = async (
  user_answer_id: string,
  data: {
    user_id: string;
    tryout_id: string;
    question_id: string;
    user_answer: string;
  }
) => {
  try {
    const res = await httpRequest.put<BaseResponseProps<any>>(
      import.meta.env.VITE_BASE_URL + '/user-answer/' + user_answer_id,
      data
    );
    if (res) {
    }
    return false;
  } catch (err) {}
};
