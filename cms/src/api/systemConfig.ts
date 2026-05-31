import { httpRequest } from "../helpers/api";
import { getErrorMessage } from "../helpers/errorHandler";
import { message } from "antd";

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export async function apiGetSystemConfigs(): Promise<SystemConfig[]> {
  try {
    const response = await httpRequest.get("/system-config");
    return response.data?.data ?? [];
  } catch (err) {
    message.error(getErrorMessage(err));
    return [];
  }
}

export async function apiUpdateSystemConfig(key: string, value: string): Promise<boolean> {
  try {
    await httpRequest.put(`/system-config/${key}`, { value });
    return true;
  } catch (err) {
    message.error(getErrorMessage(err));
    return false;
  }
}
