import { asyncHandler } from "../utils/async-handler.utils.js";
import { User } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import crypto from "crypto";

import {
  getSpotifyAuthURL,
  exchangeCodeForToken,
  getSpotifyUserProfile,
} from "../services/spotify.service.js";

const authStateStore = new Map();
const AUTH_STATE_TTL_MS = 5 * 60 * 1000;
const REQUIRED_SPOTIFY_SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-top-read",
];

const setAuthState = (state) => {
  authStateStore.set(state, Date.now() + AUTH_STATE_TTL_MS);
};

const consumeAuthState = (state) => {
  const expiresAt = authStateStore.get(state);
  authStateStore.delete(state);

  return Boolean(expiresAt && expiresAt > Date.now());
};

const loginWithSpotify = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");

  const url = getSpotifyAuthURL({ state });
  setAuthState(state);

  res.cookie("spotify_auth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 5 * 60 * 1000,
  });

  return res.redirect(url);
});

const spotifyCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

  if (error) {
    return res.redirect(`${frontendURL}/auth/callback?error=spotify_auth_failed`);
  }

  if (!code) {
    throw new ApiError(400, "Authorization code missing");
  }

  const storedState = req.cookies?.spotify_auth_state;
  const matchedCookieState = Boolean(state && storedState && state === storedState);
  const matchedStoredState = Boolean(state && consumeAuthState(state));

  if (!matchedCookieState && !matchedStoredState) {
    throw new ApiError(400, "State mismatch");
  }

  res.clearCookie("spotify_auth_state");

  const tokenData = await exchangeCodeForToken({ code });
  const spotifyScopes = (tokenData.scope || "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);

  const missingScopes = REQUIRED_SPOTIFY_SCOPES.filter(
    (scope) => !spotifyScopes.includes(scope)
  );

  if (missingScopes.length) {
    return res.redirect(
      `${frontendURL}/auth/callback?error=missing_scopes&missing=${encodeURIComponent(
        missingScopes.join(",")
      )}`
    );
  }

  const spotifyProfile = await getSpotifyUserProfile({
    accessToken: tokenData.accessToken,
  });

  const expiresAt = Date.now() + tokenData.expiresIn * 1000;

  let user = await User.findOne({
    spotifyUserId: spotifyProfile.spotifyUserId,
  });

  if (!user) {
    user = await User.create({
      spotifyUserId: spotifyProfile.spotifyUserId,
      displayName: spotifyProfile.displayName,
      profileImage: spotifyProfile.profileImage,
      spotifyEmail: spotifyProfile.spotifyEmail,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiresAt: expiresAt,
      spotifyScopes,
    });
  } else {
    user.accessToken = tokenData.accessToken;
    user.refreshToken = tokenData.refreshToken;
    user.tokenExpiresAt = expiresAt;
    user.spotifyEmail = spotifyProfile.spotifyEmail;
    user.spotifyScopes = spotifyScopes;

    await user.save();
  }

  const jwtToken = generateAccessToken({
    userId: user._id,
    spotifyUserId: user.spotifyUserId,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id,
    spotifyUserId: user.spotifyUserId,
  });

  res.cookie("accessToken", jwtToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.redirect(`${frontendURL}/auth/callback?token=${encodeURIComponent(jwtToken)}`);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.clearCookie("spotify_auth_state", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export { loginWithSpotify, spotifyCallback, logout };