import { message } from "antd";
import { getErrorMessage } from "../helpers/errorHandler";
import { httpRequest } from "../helpers/api";
import { BaseResponsePaginationProps } from "../types/config.type";

export async function apiGetUsers() {
  try {
    const res = await httpRequest.get<
      BaseResponsePaginationProps<{ user_id: string; name: string }>
    >(process.env.REACT_APP_BASE_URL + "/user");
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}
