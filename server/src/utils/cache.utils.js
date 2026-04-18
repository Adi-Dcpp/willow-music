const cache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 min

export const getCache = (key) => {
  const cachedData = cache.get(key);

  if (!cachedData) return null;

  const { value, timestamp } = cachedData;

  const isValid = Date.now() < timestamp + CACHE_TTL;

  if (!isValid) {
    cache.delete(key);
    return null;
  }

  return value;
};

export const setCache = (key, value) => {
  cache.set(key, {
    value,
    timestamp: Date.now(),
  });
};

export const clearCache = (key) => {
  cache.delete(key);
};