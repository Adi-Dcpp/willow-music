const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

if (!apiBaseUrl) {
  throw new Error("VITE_API_BASE_URL is required");
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

const normalizeLoopbackApiBaseUrl = (value) => {
  const normalized = value.replace(/\/+$/, "").replace(/\/api$/, "");

  if (typeof window === "undefined") {
    return normalized;
  }

  try {
    const parsed = new URL(normalized);
    const currentHost = window.location.hostname;

    if (
      LOOPBACK_HOSTS.has(parsed.hostname) &&
      LOOPBACK_HOSTS.has(currentHost) &&
      parsed.hostname !== currentHost
    ) {
      parsed.hostname = currentHost;
      return parsed.origin;
    }

    return parsed.origin;
  } catch {
    return normalized;
  }
};

export const API_BASE_URL = normalizeLoopbackApiBaseUrl(apiBaseUrl);
export const API_ROOT_URL = `${API_BASE_URL}/api`;
