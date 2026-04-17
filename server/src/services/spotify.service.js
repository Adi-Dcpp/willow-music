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
    scope: [
      "user-top-read",
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

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in,
      expiresAt: Date.now() + expires_in * 1000,
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
      albumImage: track.album.images?.[0]?.url || null,
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
      image: artist.images?.[0]?.url || null,
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
  userId,
  name,
  isPublic = true,
}) => {
  try {
    const url = `https://api.spotify.com/v1/users/${userId}/playlists`;

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
    throw new ApiError(
      error.response?.status || 500,
      "Failed to create playlist",
    );
  }
};

// 8. Add Tracks to Playlist
const addTracksToPlaylist = async ({ accessToken, playlistId, trackUris }) => {
  try {
    if (!trackUris?.length) {
      return { success: false, message: "No tracks to add" };
    }

    const url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

    // Spotify allows max 100 per request
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
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
    }

    return { success: true };
  } catch (error) {
    throw new ApiError(
      error.response?.status || 500,
      "Failed to add tracks to playlist",
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
