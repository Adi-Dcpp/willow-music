import crypto from "crypto";

const cache = new Map();
const aiReviewCache = new Map();

const CACHE_TTL = 5 * 60 * 1000; // 5 min
const AI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_AI_CACHE_ITEMS = 5000;

// Hash summary object for cache key
export const hashSummary = (summary) => {
  const jsonStr = JSON.stringify(summary);
  return crypto.createHash("sha256").update(jsonStr).digest("hex").slice(0, 16);
};

// AI review cache (persists longer)
export const getAIReviewCache = (userId, summaryHash) => {
  const key = `${userId}:${summaryHash}`;
  const cached = aiReviewCache.get(key);

  if (!cached) return null;

  const { value, timestamp } = cached;
  const isValid = Date.now() < timestamp + AI_CACHE_TTL;

  if (!isValid) {
    aiReviewCache.delete(key);
    return null;
  }

  return value;
};

export const setAIReviewCache = (userId, summaryHash, review) => {
  const key = `${userId}:${summaryHash}`;

  if (aiReviewCache.size >= MAX_AI_CACHE_ITEMS && !aiReviewCache.has(key)) {
    const firstKey = aiReviewCache.keys().next().value;
    if (firstKey) {
      aiReviewCache.delete(firstKey);
    }
  }

  aiReviewCache.set(key, {
    value: review,
    timestamp: Date.now(),
  });
};

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