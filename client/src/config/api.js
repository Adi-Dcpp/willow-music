export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim();

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL is not set");
}

// Normalize accidental trailing slashes or '/api' suffixes.
const normalizedApiBaseUrl = API_BASE_URL.replace(/\/+$/, "").replace(/\/api$/, "");

export const API_ROOT_URL = `${normalizedApiBaseUrl}/api`;
