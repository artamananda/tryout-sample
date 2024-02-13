import { UserProperties, RoleList } from "../types/user.type";
import { IHttpResponse } from "./pagination";
import axios from "axios";

export const APP_AUTH_TOKEN = process.env.REACT_APP_ID + "_auth";

export function saveToken(token: string) {
  return localStorage.setItem(APP_AUTH_TOKEN, token);
}

export function getToken() {
  return localStorage.getItem(APP_AUTH_TOKEN);
}

export function removeToken() {
  return localStorage.removeItem(APP_AUTH_TOKEN);
}

function capitalizeFirstLetter(text: string = "") {
  return text.charAt(0)?.toUpperCase() + text.slice(1);
}

export function showRoleName(role: string) {
  if (RoleList[role]) {
    return RoleList[role];
  } else {
    return role
      .split("_")
      .map((item) => capitalizeFirstLetter(item))
      .join(" ");
  }
}

export const getAdminRoles = () => {
  return Object.keys(RoleList).filter((v) => v.includes("admin"));
};

export const getLoginData = async (token?: string) => {
  const headers = {
    Authorization: "Bearer " + (token ? token : getToken()),
  };
  const resultUser = await axios.get<IHttpResponse<UserProperties>>(
    process.env.REACT_APP_BASE_URL + "/users/me",
    { headers }
  );

  return {
    user: resultUser.data.payload,
    role: resultUser.data.payload.userType,
  };
};
