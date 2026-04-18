const apiBaseUrlFromEnv = import.meta.env.VITE_API_BASE_URL?.trim();

if (!apiBaseUrlFromEnv) {
  throw new Error("VITE_API_BASE_URL is not set");
}

// Normalize accidental trailing slashes or '/api' suffixes.
export const API_BASE_URL = apiBaseUrlFromEnv.replace(/\/+$/, "").replace(/\/api$/, "");

export const API_ROOT_URL = `${API_BASE_URL}/api`;
