import { message } from "antd";
import { getErrorMessage } from "../helpers/errorHandler";
import { httpRequest } from "../helpers/api";
import { FetchTryoutResultResponse } from "../types/tryoutResult.type";

export async function apiGetTryoutResult(tryoutId: string) {
  try {
    const res = await httpRequest.get<FetchTryoutResultResponse>(
      `${import.meta.env.VITE_BASE_URL}/tryout/${tryoutId}/results`,
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
    return null;
  }
}
