import { message } from 'antd';
import { httpRequest } from '../helpers/api';
import { getErrorMessage } from '../helpers/errorHandler';
import { BaseResponseProps } from '../types/config.type';
import { CreateQuestionRequest, QuestionProps } from '../types/question';

export async function apiCreateQuestion(data: CreateQuestionRequest) {
  try {
    const res = await httpRequest.post<BaseResponseProps<QuestionProps>>(process.env.REACT_APP_BASE_URL + '/question/' + data.tryout_id, data);
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    // console.error(error);
    // message.error(error);
  }
}

export async function apiUpdateQuestion(data: QuestionProps) {
  try {
    const res = await httpRequest.put<BaseResponseProps<QuestionProps>>(process.env.REACT_APP_BASE_URL + '/question/' + data.question_id, data);
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function doCreateQuestions(data: CreateQuestionRequest[]) {
  try {
    const res = await Promise.all(
      data.map(async (item) => {
        await apiCreateQuestion(item);
      })
    );

    if (res) {
      message.success('success create question');
    }
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function fetchQuestions(tryoutId: string, questionType: string) {
  try {
    const url = `${process.env.REACT_APP_BASE_URL}/question?tryoutId=${tryoutId}`;
    const res = await httpRequest.get<BaseResponseProps<any>>(url);
    const questions = res.data.payload?.results?.filter((q: any) => q.type === questionType);

    return questions;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
    throw error;
  }
}
