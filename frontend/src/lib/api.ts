import axios from "axios";

import { API_BASE_URL } from "@/lib/constants";
import { getAccessToken, removeAccessToken } from "@/features/auth/auth.storage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeAccessToken();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);