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
      process.env.REACT_APP_BASE_URL + '/user-answer',
      data
    );
    if (res) {
      console.log('Saved');
    }
    return false;
  } catch (err) {
    console.log(err);
  }
};
