import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { BaseResponseProps } from "../types/config.type";
import { CreateQuestionRequest, QuestionProps } from "../types/question";

export async function apiCreateQuestion(data: CreateQuestionRequest) {
  try {
    const res = await httpRequest.post<BaseResponseProps<QuestionProps>>(
      process.env.REACT_APP_BASE_URL + "/question/" + data.tryout_id,
      data
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function doCreateQuestions(data: any) {
  try {
    let newData: CreateQuestionRequest[] = [];
    await Promise.all(
      newData.map(async (item) => {
        await apiCreateQuestion(item);
      })
    );
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}
