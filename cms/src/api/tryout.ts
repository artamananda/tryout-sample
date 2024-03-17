import { message } from "antd";
import { getErrorMessage } from "../helpers/errorHandler";
import { httpRequest } from "../helpers/api";
import {
  CreateTryoutRequest,
  FetchAllTryoutsResponse,
  TryoutProps,
  UpdateTryoutRequest,
} from "../types/tryout.type";
import { BaseResponseProps } from "../types/config.type";

export async function apiGetTryouts() {
  try {
    const res = await httpRequest.get<FetchAllTryoutsResponse>(
      process.env.REACT_APP_BASE_URL + "/tryout"
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function apiGetTryout(tryoutId: string) {
  try {
    const res = await httpRequest.get<TryoutProps>(
      process.env.REACT_APP_BASE_URL + "/tryout/" + tryoutId
    );
    return res;
  } catch (err) {
    return null;
  }
}

export async function apiCreateTryout(data: CreateTryoutRequest) {
  try {
    const res = await httpRequest.post<BaseResponseProps<TryoutProps>>(
      process.env.REACT_APP_BASE_URL + "/tryout",
      data
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function apiUpdateTryout(
  tryoutId: string,
  data: UpdateTryoutRequest
) {
  try {
    const res = await httpRequest.patch<BaseResponseProps<TryoutProps>>(
      process.env.REACT_APP_BASE_URL + "/tryout/" + tryoutId,
      data
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}

export async function apiDeleteTryout(tryoutId: string) {
  try {
    const res = await httpRequest.delete<BaseResponseProps<any>>(
      process.env.REACT_APP_BASE_URL + "/tryout/" + tryoutId
    );
    return res;
  } catch (err) {
    const error = getErrorMessage(err);
    console.error(error);
    message.error(error);
  }
}
