import { asyncHandler } from "../utils/async-handler.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import { ApiResponse } from "../utils/api-response.utils.js";
import { User } from "../models/user.model.js";
import { getUserTopTracks } from "../services/spotify.service.js";
import {
  createSpotifyPlaylist,
  addTracksToPlaylist,
} from "../services/spotify.service.js";

import { getValidSpotifyAccessToken } from "./spotify.controller.js";

const createPlaylistFromTop = asyncHandler(async (req, res) => {
  const { userId, spotifyUserId } = req.user;

  const {
    timeRange = "medium_term",
    name = "Willow Playlist 🌿",
    isPublic = true,
    trackCount = 20,
  } = req.body;

  const validRanges = ["short_term", "medium_term", "long_term"];
  if (!validRanges.includes(timeRange)) {
    throw new ApiError(400, "Invalid timeRange");
  }

  const parsedTrackCount = Math.min(
    Math.max(Number(trackCount) || 20, 1),
    50
  );

  const user = await User.findById(userId).select(
    "accessToken refreshToken tokenExpiresAt"
  );

  if (!user) throw new ApiError(404, "User not found");

  const accessToken = await getValidSpotifyAccessToken(user);

  const topTracks = await getUserTopTracks({
    accessToken,
    timeRange,
    limit: parsedTrackCount,
  });

  if (!topTracks?.length) {
    throw new ApiError(400, "No tracks found");
  }

  const { playlistId, playlistUrl } = await createSpotifyPlaylist({
    accessToken,
    userId: spotifyUserId,
    name,
    isPublic,
  });

  const trackUris = topTracks.map(
    (track) => `spotify:track:${track.id}`
  );

  await addTracksToPlaylist({
    accessToken,
    playlistId,
    trackUris,
  });

  return res.status(201).json(
    new ApiResponse(201, "Playlist created successfully", {
      playlistId,
      playlistUrl,
      totalTracks: trackUris.length,
    })
  );
});

export { createPlaylistFromTop };