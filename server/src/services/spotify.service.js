import axios from "axios";
import { ApiError } from "../utils/api-error.utils.js";

// Helper for Spotify Auth Header
const getSpotifyAuthHeader = () =>
  "Basic " +
  Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

// 1. Get Spotify Auth URL
const getSpotifyAuthURL = ({ state }) => {
  const baseURL = "https://accounts.spotify.com/authorize";

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    show_dialog: "true",
    scope: [
      "user-top-read",
      "user-read-email",
      "playlist-modify-public",
      "playlist-modify-private",
    ].join(" "),
    state,
  });

  return `${baseURL}?${params.toString()}`;
};

// 2. Exchange Code for Token
const exchangeCodeForToken = async ({ code }) => {
  try {
    const url = "https://accounts.spotify.com/api/token";

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getSpotifyAuthHeader(),
    };

    const response = await axios.post(url, body.toString(), { headers });

    const { access_token, refresh_token, expires_in, scope } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
      scope,
    };
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      error.response?.data?.error_description || "Failed to exchange code",
    );
  }
};

// 3. Get User Profile
const getSpotifyUserProfile = async ({ accessToken }) => {
  try {
    const url = "https://api.spotify.com/v1/me";

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = response.data;

    return {
      spotifyUserId: data.id,
      displayName: data.display_name,
      profileImage: data.images?.[0]?.url || null,
      spotifyEmail: data.email || null,
    };
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      "Failed to fetch user profile",
    );
  }
};

// 4. Refresh Access Token
const refreshSpotifyAccessToken = async ({ refreshToken }) => {
  try {
    const url = "https://accounts.spotify.com/api/token";

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getSpotifyAuthHeader(),
    };

    const response = await axios.post(url, body.toString(), { headers });

    const { access_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
    };
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      "Failed to refresh access token",
    );
  }
};

// 5. Get Top Tracks
const getUserTopTracks = async ({
  accessToken,
  timeRange = "short_term",
  limit = 20,
}) => {
  try {
    const url = "https://api.spotify.com/v1/me/top/tracks";

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        time_range: timeRange,
        limit: Math.min(limit, 50),
      },
    });

    return response.data.items.map((track) => ({
      id: track.id,
      name: track.name,
      artistNames: track.artists.map((a) => a.name),
      albumImageUrl: track.album.images?.[0]?.url || null,
      uri: track.uri,
    }));
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      "Failed to fetch top tracks",
    );
  }
};

// 6. Get Top Artists
const getUserTopArtists = async ({
  accessToken,
  timeRange = "short_term",
  limit = 20,
}) => {
  try {
    const url = "https://api.spotify.com/v1/me/top/artists";

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        time_range: timeRange,
        limit: Math.min(limit, 50),
      },
    });

    return response.data.items.map((artist) => ({
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      imageUrl: artist.images?.[0]?.url || null,
    }));
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      "Failed to fetch top artists",
    );
  }
};

// 7. Create Playlist
const createSpotifyPlaylist = async ({
  accessToken,
  name,
  isPublic = true,
}) => {
  try {
    const url = "https://api.spotify.com/v1/me/playlists";

    const response = await axios.post(
      url,
      { name, public: isPublic },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    return {
      playlistId: response.data.id,
      playlistUrl: response.data.external_urls.spotify,
    };
  } catch (error) {
    const rawStatus = error.response?.status;
    const rawData = error.response?.data;
    const rawMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error_description ||
      "";

    const spotifyMessage =
      rawStatus === 403
        ? (
            rawMessage && rawMessage.toLowerCase() !== "forbidden"
              ? rawMessage
              : `Spotify denied playlist creation (403) at POST /v1/me/playlists. Raw Spotify response: ${JSON.stringify(rawData || { message: "Forbidden" })}`
          )
        : (rawMessage || "Failed to create playlist");

    throw new ApiError(
      rawStatus || 500,
      spotifyMessage,
    );
  }
};

// 8. Add Tracks to Playlist
const addTracksToPlaylist = async ({ accessToken, playlistId, trackUris }) => {
  try {
    const normalizedUris = (trackUris || []).filter(
      (uri) => typeof uri === "string" && /^spotify:track:[A-Za-z0-9]{22}$/.test(uri),
    );

    if (process.env.PLAYLIST_DEBUG === "true") {
      console.log("[playlist:add] playlistId:", playlistId);
      console.log("[playlist:add] urisCount:", normalizedUris.length);
      console.log("[playlist:add] urisSample:", normalizedUris.slice(0, 5));
    }

    if (!normalizedUris.length) {
      return { success: false, message: "No tracks to add" };
    }

    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    let addedCount = 0;
    let skippedCount = 0;
    let firstForbiddenDetail = "";

    const addChunkOneByOne = async (chunk) => {
      for (const uri of chunk) {
        try {
          await axios.post(
            url,
            { uris: [uri] },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            },
          );
          addedCount += 1;
        } catch (singleError) {
          const singleStatus = singleError.response?.status;

          if (singleStatus === 400 || singleStatus === 403) {
            skippedCount += 1;
            if (!firstForbiddenDetail) {
              const singleData = singleError.response?.data;
              firstForbiddenDetail = JSON.stringify(singleData || { message: "Forbidden" });
            }
            continue;
          }

          throw singleError;
        }
      }
    };

    // Spotify allows max 100 per request
    const chunks = [];
    for (let i = 0; i < normalizedUris.length; i += 100) {
      chunks.push(normalizedUris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      try {
        await axios.post(
          url,
          { uris: chunk },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );
        addedCount += chunk.length;
      } catch (chunkError) {
        const status = chunkError.response?.status;

        if (process.env.PLAYLIST_DEBUG === "true") {
          console.log("[playlist:add] chunkError status:", status);
          console.log("[playlist:add] chunkError data:", chunkError.response?.data || null);
        }

        if (status === 400 || status === 403 || (status >= 500 && status < 600)) {
          await addChunkOneByOne(chunk);
        } else {
          throw chunkError;
        }
      }
    }

    if (addedCount === 0) {
      throw new ApiError(
        403,
        `Spotify denied adding tracks (403) at POST /v1/playlists/${playlistId}/tracks. Raw Spotify response: ${firstForbiddenDetail || JSON.stringify({ message: "Forbidden" })}`,
      );
    }

    return {
      success: true,
      addedCount,
      skippedCount,
      partial: skippedCount > 0,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const rawStatus = error.response?.status;
    const rawData = error.response?.data;
    const rawDataString = rawData ? JSON.stringify(rawData) : "none";
    const axiosCode = error.code || "unknown";
    const endpoint = error.config?.url || `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;
    const rawMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.error_description ||
      "";

    const spotifyMessage =
      rawStatus === 403
        ? (
            rawMessage && rawMessage.toLowerCase() !== "forbidden"
              ? rawMessage
              : `Spotify denied adding tracks (403) at POST /v1/playlists/${playlistId}/tracks. Raw Spotify response: ${JSON.stringify(rawData || { message: "Forbidden" })}`
          )
        : rawStatus === 411
        ? "Spotify rejected add-tracks request with 411 Length Required. This usually means Content-Length: 0 is required for query-parameter POST fallback."
        : (
            rawMessage ||
            `Failed to add tracks to playlist. status=${rawStatus || "none"} axiosCode=${axiosCode} endpoint=${endpoint} response=${rawDataString}`
          );

    throw new ApiError(
      rawStatus || 500,
      spotifyMessage,
    );
  }
};

export {
  getSpotifyAuthURL,
  exchangeCodeForToken,
  getSpotifyUserProfile,
  refreshSpotifyAccessToken,
  getUserTopTracks,
  getUserTopArtists,
  createSpotifyPlaylist,
  addTracksToPlaylist,
};
