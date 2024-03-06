import { message } from "antd";
import { getErrorMessage } from "../helpers/errorHandler";
import { httpRequest } from "../helpers/api";
import { FetchAllUserAnswerResponse } from "../types/userAnswer.type";

export async function apiGetUserAnswer() {
  try {
    const res = await httpRequest.get<FetchAllUserAnswerResponse>(
      process.env.REACT_APP_BASE_URL + "/user-answer"
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}
