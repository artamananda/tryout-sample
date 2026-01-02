import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { BaseResponseProps } from "../types/config.type";
import {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
} from "../types/ai.type";

export async function apiGenerateQuestions(
  data: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse | undefined> {
  try {
    const res = await httpRequest.post<
      BaseResponseProps<GenerateQuestionsResponse>
    >(process.env.REACT_APP_BASE_URL + "/ai/generate-questions", data);
    return res.data.payload;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return undefined;
  }
}
