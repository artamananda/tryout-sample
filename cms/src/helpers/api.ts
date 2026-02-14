import axios from "axios";
import { getToken } from "./auth";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
axios.defaults.timeout = 300000;

export const httpRequest = axios.create();

httpRequest.interceptors.request.use(
  async (config: any) => {
    if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
    config.headers["Authorization"] = "Bearer " + getToken();
    config.headers["Access-Control-Allow-Origin"] = "*";
    return config;
  },
  (error) => {
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
      return Promise.reject(error.response);
    } else {
    }
  }
);
