import axios from "axios";
import { API_ROOT_URL } from "../config/api";

axios.defaults.withCredentials = true;

export const api = axios.create({
  baseURL: API_ROOT_URL,
  withCredentials: true,
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
