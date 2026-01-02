import { message } from "antd";
import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { BaseResponseProps } from "../types/config.type";
import {
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  AIChatRequest,
  AIChatResponse,
  SaveChatLogRequest,
  CreateBankSoalBatchRequest,
  BankSoalResponse,
  ChatLog,
  GeneratedQuestion,
  ChatArtifact,
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

export async function apiSaveChatLog(
  data: SaveChatLogRequest
): Promise<boolean> {
  try {
    await httpRequest.post<BaseResponseProps<null>>(
      process.env.REACT_APP_BASE_URL + "/ai/chat/log",
      data
    );
    return true;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return false;
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

export async function apiGetHistory(): Promise<ChatLog[] | undefined> {
  try {
    const res = await httpRequest.get<BaseResponseProps<ChatLog[]>>(
      process.env.REACT_APP_BASE_URL + "/ai/chat/history"
    );
    return res.data.payload;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return undefined;
  }
}

export async function apiGetSession(id: string): Promise<ChatLog | undefined> {
  try {
    const res = await httpRequest.get<BaseResponseProps<ChatLog>>(
      process.env.REACT_APP_BASE_URL + `/ai/chat/history/${id}`
    );
    return res.data.payload;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return undefined;
  }
}

export async function apiDeleteSession(id: string): Promise<boolean> {
  try {
    await httpRequest.delete<BaseResponseProps<null>>(
      process.env.REACT_APP_BASE_URL + `/ai/chat/history/${id}`
    );
    return true;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return false;
  }
}

export async function apiUpdateSession(id: string, topic: string): Promise<boolean> {
  try {
    await httpRequest.put<BaseResponseProps<null>>(
      process.env.REACT_APP_BASE_URL + `/ai/chat/history/${id}`,
      { topic }
    );
    return true;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return false;
  }
}

export async function apiGetSessionArtifacts(sessionId: string): Promise<ChatArtifact[]> {
  try {
    const res = await httpRequest.get<BaseResponseProps<ChatArtifact[]>>(
      process.env.REACT_APP_BASE_URL + `/ai/chat/history/${sessionId}/artifacts`
    );
    return res.data.payload || [];
  } catch (err) {
    return [];
  }
}

export async function apiSaveExample(topic: string, content: string): Promise<boolean> {
  try {
    await httpRequest.post<BaseResponseProps<null>>(
      process.env.REACT_APP_BASE_URL + "/ai/examples",
      { topic, content }
    );
    return true;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return false;
  }
}
