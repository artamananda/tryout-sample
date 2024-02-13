import axios from "axios";
import { getToken } from "./auth";

axios.defaults.baseURL = process.env.REACT_APP_BASE_URL;
axios.defaults.timeout = 300000;

export const httpRequest = axios.create();

httpRequest.interceptors.request.use(
  async (config: any) => {
    config.headers["Content-Type"] = "application/json";
    config.headers["Authorization"] = "Bearer " + getToken();
    return config;
  },
  (error) => {
    console.error("httpRequest: Error interceptor request:::", error.response);
    return Promise.reject(error);
  }
);

httpRequest.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error && error.response) {
      if (
        error.response.status === 403 ||
        error.response.data?.code === "err_unauthorized"
      ) {
        // removeToken();
        localStorage.clear();
        window.location.href = "/login";
      }
      console.error(
        "httpRequest: Error interceptor response:::",
        error.response
      );
      return Promise.reject(error.response);
    } else {
      console.error(error);
    }
  }
);
