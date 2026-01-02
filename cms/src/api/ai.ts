import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { BaseResponseProps } from "../types/config.type";
import {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  AIChatRequest,
  AIChatResponse,
  CreateBankSoalBatchRequest,
  BankSoalResponse,
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

export async function apiChat(
  data: AIChatRequest
): Promise<AIChatResponse | undefined> {
  try {
    const res = await httpRequest.post<BaseResponseProps<AIChatResponse>>(
      process.env.REACT_APP_BASE_URL + "/ai/chat",
      data
    );
    return res.data.payload;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return undefined;
  }
}

export async function apiSaveToBankSoal(
  data: CreateBankSoalBatchRequest
): Promise<BankSoalResponse[] | undefined> {
  try {
    const res = await httpRequest.post<BaseResponseProps<BankSoalResponse[]>>(
      process.env.REACT_APP_BASE_URL + "/bank-soal/batch",
      data
    );
    return res.data.payload;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return undefined;
  }
}
