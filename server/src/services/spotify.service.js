import axios from "axios";
import { ApiError } from "../utils/api-error.utils.js";

// Helper for Spotify Auth Header
const getSpotifyAuthHeader = () =>
  "Basic " +
  Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

const normalizeUrl = (value) => value?.trim().replace(/\/+$/, "");

const getSpotifyRedirectUri = () => {
  const explicitRedirectUri = normalizeUrl(process.env.SPOTIFY_REDIRECT_URI);
  const normalizedBackendUrl = normalizeUrl(process.env.BACKEND_URL);
  const derivedRedirectUri = normalizedBackendUrl
    ? `${normalizedBackendUrl}/api/auth/spotify/callback`
    : null;

  if (
    process.env.NODE_ENV === "production" &&
    explicitRedirectUri &&
    derivedRedirectUri &&
    explicitRedirectUri !== derivedRedirectUri
  ) {
    throw new ApiError(
      500,
      "SPOTIFY_REDIRECT_URI must match BACKEND_URL/api/auth/spotify/callback in production"
    );
  }

  if (explicitRedirectUri) {
    return explicitRedirectUri;
  }

  if (derivedRedirectUri) {
    return derivedRedirectUri;
  }

  throw new ApiError(500, "BACKEND_URL or SPOTIFY_REDIRECT_URI is required");
};

// 1. Get Spotify Auth URL
const getSpotifyAuthURL = ({ state }) => {
  const baseURL = "https://accounts.spotify.com/authorize";

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(),
    show_dialog: "true",
    scope: [
      "user-top-read",
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
      redirect_uri: getSpotifyRedirectUri(),
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

export {
  getSpotifyAuthURL,
  exchangeCodeForToken,
  getSpotifyUserProfile,
  refreshSpotifyAccessToken,
  getUserTopTracks,
  getUserTopArtists,
  getSpotifyRedirectUri,
};
