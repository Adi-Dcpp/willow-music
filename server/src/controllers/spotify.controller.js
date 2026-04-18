import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import { User } from "../models/user.model.js";
import {
  getUserTopTracks,
  getUserTopArtists,
} from "../services/spotify.service.js";
import { getCache, setCache } from "../utils/cache.utils.js";
import { buildUserSummary } from "../utils/summary.utils.js";

const getValidSpotifyAccessToken = async (user) => {
  const bufferTime = 60 * 1000;

  if (user.tokenExpiresAt && Date.now() < user.tokenExpiresAt - bufferTime) {
    return user.accessToken;
  }

  if (!user.refreshToken) {
    throw new ApiError(401, "Spotify refresh token missing");
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      401,
      data.error_description || "Failed to refresh Spotify token"
    );
  }

  user.accessToken = data.access_token;
  user.tokenExpiresAt = Date.now() + data.expires_in * 1000;

  if (data.refresh_token) {
    user.refreshToken = data.refresh_token;
  }

  await user.save();

  return user.accessToken;
};

const getUserOrThrow = async (userId) => {
  const user = await User.findById(userId).select(
    "accessToken refreshToken tokenExpiresAt"
  );

  if (!user) throw new ApiError(404, "User does not exist");

  const accessToken = await getValidSpotifyAccessToken(user);

  if (!accessToken) {
    throw new ApiError(401, "Spotify access token missing");
  }

  return user;
};

const validateQuery = (timeRange, limit) => {
  const validRanges = ["short_term", "medium_term", "long_term"];

  if (!validRanges.includes(timeRange)) {
    throw new ApiError(400, "Invalid timeRange");
  }

  return Math.min(Math.max(Number(limit) || 20, 1), 50);
};

const getTopTracks = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const user = await getUserOrThrow(userId);

  const { timeRange = "long_term", limit = 20 } = req.query;
  const parsedLimit = validateQuery(timeRange, limit);

  const accessToken = user.accessToken;

  const topTracks = await getUserTopTracks({
    accessToken,
    timeRange,
    limit: parsedLimit,
  });

  return res.status(200).json(
    new ApiResponse(200, "User's top tracks fetched successfully", {
      timeRange,
      topTracks,
    })
  );
});

const getTopArtists = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const user = await getUserOrThrow(userId);

  const { timeRange = "short_term", limit = 20 } = req.query;
  const parsedLimit = validateQuery(timeRange, limit);

  const accessToken = user.accessToken;

  const topArtists = await getUserTopArtists({
    accessToken,
    timeRange,
    limit: parsedLimit,
  });

  return res.status(200).json(
    new ApiResponse(200, "User's top artists fetched successfully", {
      timeRange,
      topArtists,
    })
  );
});

const getTop = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const user = await getUserOrThrow(userId);

  const { timeRange = "medium_term", limit = 20 } = req.query;
  const parsedLimit = validateQuery(timeRange, limit);

  const cacheKey = `${userId}_${timeRange}_${parsedLimit}_insights`;

  const cachedData = getCache(cacheKey);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  const accessToken = user.accessToken;

  const [topTracks, topArtists] = await Promise.all([
    getUserTopTracks({
      accessToken,
      timeRange,
      limit: parsedLimit,
    }),
    getUserTopArtists({
      accessToken,
      timeRange,
      limit: parsedLimit,
    }),
  ]);

  const result = buildUserSummary(topTracks?.items || topTracks, topArtists?.items || topArtists);

  setCache(cacheKey, result);

  return res.status(200).json(result);
});

export {
  getTopTracks,
  getTopArtists,
  getTop,
  getValidSpotifyAccessToken,
  getUserOrThrow,
};