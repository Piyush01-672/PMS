import axios from 'axios';
import { API_BASE } from './config';

let csrfToken = null;
let unauthorizedHandler = null;

export const setCsrfToken = (token) => {
  csrfToken = token || null;
};
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

export const api = axios.create({ baseURL: API_BASE, withCredentials: true, timeout: 60_000 });

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (csrfToken && !['get', 'head', 'options'].includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    error.status = status;
    const payload = error.response?.data?.error;
    error.details = payload?.details;
    const detailText =
      payload?.details && typeof payload.details === 'object' && !Array.isArray(payload.details)
        ? Object.entries(payload.details)
            .filter(([, v]) => typeof v === 'string')
            .slice(0, 3)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ')
        : '';
    error.userMessage =
      (payload?.message ? `${payload.message}${detailText ? ` — ${detailText}` : ''}` : null) ||
      (error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : null) ||
      (!error.response ? 'Network error — check your internet connection.' : error.message);
    if (status === 401 && unauthorizedHandler && !error.config?.skipAuthRedirect) unauthorizedHandler(error);
    return Promise.reject(error);
  },
);

export const errorMessage = (error, fallback = 'Something went wrong') => error?.userMessage || error?.message || fallback;

export const get = (url, params, config) => api.get(url, { params, ...config }).then((r) => r.data);
