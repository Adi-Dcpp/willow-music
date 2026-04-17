import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import { User } from "../models/user.model.js";
import {
  getUserTopTracks,
  getUserTopArtists,
} from "../services/spotify.service.js";

const getTopTracks = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await User.findById(userId).select("accessToken");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.accessToken) {
    throw new ApiError(401, "Spotify access token missing");
  }

  const { timeRange = "long_term", limit = 20 } = req.query;

  const topTracks = await getUserTopTracks({
    accessToken: user.accessToken,
    timeRange,
    limit: Number(limit),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User's top tracks fetched successfully",
        topTracks
      )
    );
});

const getTopArtists = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  const user = await User.findById(userId).select("accessToken");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.accessToken) {
    throw new ApiError(401, "Spotify access token missing");
  }

  const { timeRange = "short_term", limit = 20 } = req.query;

  const topArtists = await getUserTopArtists({
    accessToken: user.accessToken,
    timeRange,
    limit: Number(limit),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "User's top artists fetched successfully",
        topArtists
      )
    );
});

export { getTopTracks, getTopArtists };