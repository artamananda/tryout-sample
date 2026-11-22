import axios from 'axios';
import { getToken } from './auth';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
axios.defaults.timeout = 300000;

export const httpRequest = axios.create();

const isAuthEndpoint = (url = '') =>
  /\/(login|register|forgot-password|email\/send-otp)/.test(url);

httpRequest.interceptors.request.use(
  async (config: any) => {
    // Let the browser set the multipart boundary for FormData bodies.
    if (!(config.data instanceof FormData) && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = 'Bearer ' + token;
    }
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
      const status = error.response.status;
      const url = error.config?.url;
      // Only an expired/invalid JWT ends the session. Other 401s (e.g. a wrong
      // tryout token) are normal errors the screen handles itself.
      const isSessionExpired =
        status === 401 &&
        error.response.data?.payload === 'Invalid or expired JWT';
      if ((isSessionExpired || status === 403) && getToken() && !isAuthEndpoint(url)) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error.response);
    }
    // Network error or timeout: there is no response to pass on.
    return Promise.reject({
      data: {
        message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.'
      }
    });
  }
);
