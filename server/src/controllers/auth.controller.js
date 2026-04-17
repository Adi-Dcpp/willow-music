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

const loginWithSpotify = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");

  const url = getSpotifyAuthURL({ state });

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

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=spotify_auth_failed`
    );
  }

  if (!code) {
    throw new ApiError(400, "Authorization code missing");
  }

  const storedState = req.cookies?.spotify_auth_state;

  if (!state || !storedState || state !== storedState) {
    throw new ApiError(400, "State mismatch");
  }

  res.clearCookie("spotify_auth_state");

  const tokenData = await exchangeCodeForToken({ code });

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
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiresAt: expiresAt,
    });
  } else {
    user.accessToken = tokenData.accessToken;
    user.refreshToken = tokenData.refreshToken;
    user.tokenExpiresAt = expiresAt;

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

  return res.json({
    success: true,
    message: "Login successful",
    token: jwtToken,
  });
});

export { loginWithSpotify, spotifyCallback };