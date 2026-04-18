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
  if (!req.user?.userId) {
    throw new ApiError(401, "Unauthorized: missing user session");
  }

  if (process.env.PLAYLIST_DEBUG === "true") {
    console.log("[playlist] user:", req.user);
    console.log("[playlist] hasCookieHeader:", Boolean(req.headers.cookie));
  }

  const { userId } = req.user;

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
    "accessToken refreshToken tokenExpiresAt spotifyScopes spotifyUserId"
  );

  if (!user) throw new ApiError(404, "User not found");

  const grantedScopes = Array.isArray(user.spotifyScopes) ? user.spotifyScopes : [];
  const missingScopes = ["playlist-modify-private", "playlist-modify-public"].filter(
    (scope) => !grantedScopes.includes(scope)
  );

  if (missingScopes.length) {
    throw new ApiError(
      403,
      `Spotify scopes missing: ${missingScopes.join(", ")}. Please logout, login again, and approve playlist permissions.`
    );
  }

  const tokenFingerprint = (token) => {
    if (typeof token !== "string" || token.length < 10) return "invalid-token";
    return `${token.slice(0, 6)}...${token.slice(-4)}`;
  };

  let accessToken = await getValidSpotifyAccessToken(user);
  let createTokenPrint = tokenFingerprint(accessToken);

  const topTracks = await getUserTopTracks({
    accessToken,
    timeRange,
    limit: parsedTrackCount,
  });

  if (!topTracks?.length) {
    throw new ApiError(400, "No tracks found");
  }

  const trackUris = topTracks
    .map((track) => track?.uri)
    .filter((uri) => typeof uri === "string" && /^spotify:track:[A-Za-z0-9]{22}$/.test(uri));

  if (process.env.PLAYLIST_DEBUG === "true") {
    console.log("[playlist] trackUrisCount:", trackUris.length);
    console.log("[playlist] trackUrisSample:", trackUris.slice(0, 5));
  }

  if (!trackUris.length) {
    throw new ApiError(400, "No valid Spotify track URIs found from top tracks");
  }

  const createForVisibility = async (publicFlag) => {
    accessToken = await getValidSpotifyAccessToken(user);
    createTokenPrint = tokenFingerprint(accessToken);

    const playlist = await createSpotifyPlaylist({
      accessToken,
      name,
      isPublic: publicFlag,
    });

    return {
      ...playlist,
      visibility: publicFlag ? "public" : "private",
    };
  };

  let created;
  try {
    created = await createForVisibility(Boolean(isPublic));
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 403 && isPublic) {
      try {
        created = await createForVisibility(false);
      } catch (fallbackError) {
        if (fallbackError instanceof ApiError && fallbackError.statusCode === 403) {
          const detail = fallbackError.message || error.message || "Spotify denied playlist creation";
          throw new ApiError(
            403,
            `Spotify denied playlist creation: ${detail}`
          );
        }

        throw fallbackError;
      }
    } else if (error instanceof ApiError && error.statusCode === 403) {
      const detail = error.message || "Spotify denied playlist creation";
      throw new ApiError(
        403,
        `Spotify denied playlist creation: ${detail}`
      );
    } else {
      throw error;
    }
  }

  let tracksAdded = true;
  let playlistMessage = "Playlist created successfully";
  let addedCount = trackUris.length;
  let skippedCount = 0;
  let partial = false;
  let addError = null;

  try {
    accessToken = await getValidSpotifyAccessToken(user);
    const addTokenPrint = tokenFingerprint(accessToken);
    const shouldLogRawToken = process.env.PLAYLIST_DEBUG_TOKEN === "true";

    if (process.env.PLAYLIST_DEBUG === "true") {
      console.log("[playlist] createToken:", createTokenPrint);
      console.log("[playlist] addToken:", addTokenPrint);
      console.log("[playlist] tokenSame:", createTokenPrint === addTokenPrint);
      console.log("[playlist:debug] TOKEN:", shouldLogRawToken ? accessToken : addTokenPrint);
      console.log("[playlist:debug] USER:", user.spotifyUserId || "unknown-user");
      console.log("[playlist:debug] URIS:", trackUris.slice(0, 3));

      const probeUri = trackUris[0] || "spotify:track:4iV5W9uYEdYUVa79Axb7Rh";
      console.log(
        "[playlist:debug] CURL_TEST:",
        `curl -X POST \"https://api.spotify.com/v1/playlists/${created.playlistId}/tracks\" -H \"Authorization: Bearer ${accessToken}\" -H \"Content-Type: application/json\" -d '{\"uris\":[\"${probeUri}\"]}'`
      );
    }

    const addResult = await addTracksToPlaylist({
      accessToken,
      playlistId: created.playlistId,
      trackUris,
    });

    if (addResult?.success) {
      addedCount = typeof addResult.addedCount === "number" ? addResult.addedCount : trackUris.length;
      skippedCount = typeof addResult.skippedCount === "number" ? addResult.skippedCount : 0;
      partial = Boolean(addResult.partial);

      if (partial) {
        playlistMessage = "Playlist created with partial track insert due to Spotify restrictions";
      }
    }
  } catch (error) {
    // If insertion into a public playlist is blocked, retry with a private playlist.
    if (error instanceof ApiError && error.statusCode === 403 && created.visibility === "public") {
      try {
        accessToken = await getValidSpotifyAccessToken(user);
        const privateCreated = await createForVisibility(false);

        accessToken = await getValidSpotifyAccessToken(user);
        await addTracksToPlaylist({
          accessToken,
          playlistId: privateCreated.playlistId,
          trackUris,
        });

        created = privateCreated;
        playlistMessage = "Playlist created privately due to Spotify visibility restrictions";
      } catch (fallbackError) {
        tracksAdded = false;
        addedCount = 0;
        skippedCount = trackUris.length;
        partial = false;
        addError = fallbackError?.message || error.message || "Spotify denied adding tracks to both public and private playlists";
        playlistMessage = "Playlist created, but adding tracks failed";
      }
    } else if (error instanceof ApiError && error.statusCode === 403) {
      tracksAdded = false;
      addedCount = 0;
      skippedCount = trackUris.length;
      partial = false;
      addError = error.message || "Spotify denied playlist modification";
      playlistMessage = "Playlist created, but adding tracks failed";
    } else {
      tracksAdded = false;
      addedCount = 0;
      skippedCount = trackUris.length;
      partial = false;
      addError = error?.message || "Unknown error while adding tracks";
      playlistMessage = "Playlist created, but adding tracks failed";
    }
  }

  return res.status(201).json(
    new ApiResponse(201, playlistMessage, {
      playlistId: created.playlistId,
      playlistUrl: created.playlistUrl,
      totalTracks: trackUris.length,
      addedTracks: addedCount,
      skippedTracks: skippedCount,
      partial,
      addError,
      visibility: created.visibility,
      tracksAdded,
    })
  );
});

export { createPlaylistFromTop };