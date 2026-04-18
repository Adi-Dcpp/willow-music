import axios from "axios";

const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (apiUrl) {
    return apiUrl;
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:5000/api";
  }

  throw new Error("VITE_API_URL must be set in production");
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem("willow_access_token");

  if (token) {
    config.headers = {
      ...(config.headers || {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent("willow-auth-expired"));
    }
    return Promise.reject(error);
  }
);
