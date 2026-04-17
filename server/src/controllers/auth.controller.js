import { asyncHandler } from "../utils/async-handler.utils.js";
import { User } from "../models/user.model.js";
import { generateAccessToken } from "../utils/tokenUtils.js";
import { ApiError } from "../utils/apiError.js";
import crypto from "crypto";

import {
  getSpotifyAuthURL,
  exchangeCodeForToken,
  getSpotifyUserProfile,
} from "../services/spotify.service.js";

const loginWithSpotify = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(32).toString("hex");

  if (!state) {
    throw new ApiError(400, "Failed to generate state");
  }

  const spotifyAuthUrl = getSpotifyAuthURL({ state });

  if (!spotifyAuthUrl) {
    throw new ApiError(400, "Failed to generate Spotify Auth URL");
  }

  res.cookie("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 5 * 60 * 1000, // 5 min
  });

  return res.redirect(spotifyAuthUrl);
});

const spotifyCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=spotify_auth_failed`,
    );
  }

  if (!code) {
    throw new ApiError(400, "Authorization code missing");
  }

  const storedState = req.cookies?.spotify_auth_state;

  if (!state || !storedState || state !== storedState) {
    throw new ApiError(400, "State mismatch. Potential CSRF attack.");
  }

  res.clearCookie("spotify_auth_state");

  const tokenData = await exchangeCodeForToken({ code });

  if (!tokenData?.accessToken) {
    throw new ApiError(500, "Failed to retrieve Spotify access token");
  }

  const spotifyProfile = await getSpotifyUserProfile({
    accessToken: tokenData.accessToken,
  });

  let user = await User.findOne({
    spotifyUserId: spotifyProfile.spotifyUserId,
  });

  if (user) {
    user.accessToken = tokenData.accessToken;
    user.refreshToken = tokenData.refreshToken;
    user.tokenExpiresAt = tokenData.expiresAt;

    user.displayName = spotifyProfile.displayName;
    user.profileImage = spotifyProfile.profileImage;

    await user.save();
  } else {
    user = await User.create({
      spotifyUserId: spotifyProfile.spotifyUserId,
      displayName: spotifyProfile.displayName,
      profileImage: spotifyProfile.profileImage,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      tokenExpiresAt: tokenData.expiresAt,
    });
  }

  const jwtToken = generateAccessToken({
    userId: user._id,
    spotifyUserId: user.spotifyUserId,
  });

  res.cookie("accessToken", jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
});

export { loginWithSpotify, spotifyCallback };
