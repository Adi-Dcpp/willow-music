import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import { Snapshot } from "../models/snapshot.model.js";
import { generateShareId } from "../utils/id.utils.js";
import {
  getUserTopArtists,
  getUserTopTracks,
} from "../services/spotify.service.js";
import { getValidSpotifyAccessToken } from "./spotify.controller.js";
import { User } from "../models/user.model.js";
import { buildUserSummary } from "../utils/summary.utils.js";

const createSnapshot = asyncHandler(async (req, res) => {
  const { userId, spotifyUserId } = req.user;

  const { timeRange = "medium_term" } = req.body;

  const user = await User.findById(userId).select(
    "accessToken refreshToken tokenExpiresAt",
  );

  if (!user) throw new ApiError(404, "User not found");

  const accessToken = await getValidSpotifyAccessToken(user);

  const [topTracks, topArtists] = await Promise.all([
    getUserTopTracks({ accessToken, timeRange, limit: 10 }),
    getUserTopArtists({ accessToken, timeRange, limit: 10 }),
  ]);

  // Build summary for lighter, AI-ready snapshot
  const summaryResult = buildUserSummary(topTracks, topArtists);

  const shareId = generateShareId();

  const snapshot = await Snapshot.create({
    shareId,
    spotifyUserId,
    timeRange,
    topTracks: summaryResult.topTracks,
    topArtists: summaryResult.topArtists,
    summary: summaryResult.summary,
  });

  return res.status(201).json(
    new ApiResponse(201, "Snapshot created", {
      shareId,
      shareUrl: `/share/${shareId}`,
    }),
  );
});

const getSnapshot = asyncHandler(async (req, res) => {
  const { shareId } = req.params;

  const snapshot = await Snapshot.findOne({
    shareId,
    deletedAt: null,
  });

  if (!snapshot) {
    throw new ApiError(404, "Snapshot not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Snapshot fetched", snapshot));
});


const deleteSnapshot = asyncHandler(async (req, res) => {
  const { shareId } = req.params;
  const { spotifyUserId } = req.user;

  const snapshot = await Snapshot.findOne({
    shareId,
    deletedAt: null,
  });

  if (!snapshot) {
    throw new ApiError(404, "Snapshot not found");
  }

  if (snapshot.spotifyUserId !== spotifyUserId) {
    throw new ApiError(403, "You are not allowed to delete this snapshot");
  }

  snapshot.deletedAt = new Date();
  await snapshot.save();

  return res
    .status(200)
    .json(new ApiResponse(200, "Snapshot deleted successfully"));
});

export {
    createSnapshot,
    getSnapshot,
    deleteSnapshot
}
