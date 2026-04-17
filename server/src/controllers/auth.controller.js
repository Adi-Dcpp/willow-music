import { asyncHandler } from "../utils/async-handler.utils.js";
import { User } from "../models/user.model.js";
import { generateAccessToken } from "../utils/jwt.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import crypto from "crypto";

import {
  getSpotifyAuthURL,
  exchangeCodeForToken,
  getSpotifyUserProfile,
} from "../services/spotify.service.js";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

const getOAuthStateSecret = () =>
  process.env.ACCESS_TOKEN_SECRET || process.env.SPOTIFY_CLIENT_SECRET;

const toBase64Url = (value) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (value) => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (base64.length % 4)) % 4;
  return Buffer.from(base64 + "=".repeat(padLength), "base64").toString("utf8");
};

const signStatePayload = (payload) => {
  const oauthStateSecret = getOAuthStateSecret();

  if (!oauthStateSecret) {
    throw new ApiError(500, "OAuth state secret is not configured");
  }

  return crypto
    .createHmac("sha256", oauthStateSecret)
    .update(payload)
    .digest("hex");
};

const generateSignedState = () => {
  const payload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString("hex"),
    ts: Date.now(),
  });

  const encodedPayload = toBase64Url(payload);
  const signature = signStatePayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

const validateSignedState = (state) => {
  if (!state || typeof state !== "string") {
    return false;
  }

  const [encodedPayload, providedSignature] = state.split(".");
  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = signStatePayload(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  let payload;
  try {
    payload = JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    return false;
  }

  if (!payload?.ts || typeof payload.ts !== "number") {
    return false;
  }

  return Date.now() - payload.ts <= STATE_MAX_AGE_MS;
};

const loginWithSpotify = asyncHandler(async (req, res) => {
  const state = generateSignedState();

  if (!state) {
    throw new ApiError(400, "Failed to generate state");
  }

  const spotifyAuthUrl = getSpotifyAuthURL({ state });

  if (!spotifyAuthUrl) {
    throw new ApiError(400, "Failed to generate Spotify Auth URL");
  }

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

  if (!validateSignedState(state)) {
    throw new ApiError(400, "State mismatch. Potential CSRF attack.");
  }

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

  // return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  // return res.redirect("http://localhost:5000/user/me");
  return res.json({
  success: true,
  message: "Login successful",
  token: jwtToken,
});
});

export { loginWithSpotify, spotifyCallback };
