import { message } from "antd";
import { getErrorMessage } from "../helpers/errorHandler";
import { httpRequest } from "../helpers/api";
import { BaseResponsePaginationProps } from "../types/config.type";

export async function apiGetUsers() {
  try {
    const res = await httpRequest.get<
      BaseResponsePaginationProps<{ user_id: string; name: string }>
    >(import.meta.env.VITE_BASE_URL + "/user");
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    message.error(error);
  }
}

/** Gives a user the blue check (admin only). label: owner | tutor | berprestasi. */
export async function apiSetVerification(userId: string, label: string) {
  const res = await httpRequest.put(`/user/${userId}/verification`, { label });
  return res.data.payload;
}

/** Takes the blue check away from a user (admin only). */
export async function apiRemoveVerification(userId: string) {
  const res = await httpRequest.delete(`/user/${userId}/verification`);
  return res.data.payload;
}
