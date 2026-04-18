const apiBaseUrlFromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
const isProd = import.meta.env.PROD;

// Netlify production uses same-origin proxy (`/api`); local dev can still use env override.
const localBaseUrl = apiBaseUrlFromEnv
  ? apiBaseUrlFromEnv.replace(/\/+$/, "").replace(/\/api$/, "")
  : "http://localhost:5000";

export const API_BASE_URL = isProd ? "" : localBaseUrl;
export const API_ROOT_URL = isProd ? "/api" : `${API_BASE_URL}/api`;
