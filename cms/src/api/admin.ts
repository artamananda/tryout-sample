import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { message } from "antd";

export interface TriggerGenerateResult {
  type: string;
  saved: number;
}

export async function apiTriggerGenerate(
  typeCode: string,
  count: number = 5
): Promise<TriggerGenerateResult | null> {
  try {
    const response = await httpRequest.post(`/admin/generate/${typeCode}`, { count });
    return response.data?.data ?? null;
  } catch (err) {
    message.error(getErrorMessage(err));
    return null;
  }
}
