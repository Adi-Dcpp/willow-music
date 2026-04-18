import { asyncHandler } from "../utils/async-handler.utils.js";
import { User } from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.utils.js";
import { ApiError } from "../utils/api-error.utils.js";
import crypto from "crypto";
import axios from "axios";

import {
  getSpotifyAuthURL,
  getSpotifyRedirectUri,
  getSpotifyUserProfile,
} from "../services/spotify.service.js";

const REQUIRED_SPOTIFY_SCOPES = [
  "user-top-read",
];

const STATE_TTL_MS = 5 * 60 * 1000;

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "lax",
  secure: isProduction,
};

const getFrontendUrl = () => {
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }

  if (isProduction) {
    throw new ApiError(500, "FRONTEND_URL is required in production");
  }

  return "http://localhost:5173";
};

const getStateSecret = () =>
  process.env.SPOTIFY_CLIENT_SECRET || process.env.ACCESS_TOKEN_SECRET;

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

const signState = (payload) => {
  const secret = getStateSecret();

  if (!secret) {
    throw new ApiError(500, "State secret missing");
  }

  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

const createAuthState = () => {
  const payload = JSON.stringify({
    nonce: crypto.randomBytes(16).toString("hex"),
    ts: Date.now(),
  });

  const encodedPayload = toBase64Url(payload);
  const signature = signState(encodedPayload);

  return `${encodedPayload}.${signature}`;
};

const verifyAuthState = (state) => {
  if (!state || typeof state !== "string") {
    return false;
  }

  const [encodedPayload, providedSignature] = state.split(".");

  if (!encodedPayload || !providedSignature) {
    return false;
  }

  const expectedSignature = signState(encodedPayload);
  const providedBuffer = Buffer.from(providedSignature, "hex");
  const expectedBuffer = Buffer.from(expectedSignature, "hex");

  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload));
    if (!payload?.ts) {
      return false;
    }

    return Date.now() - payload.ts <= STATE_TTL_MS;
  } catch {
    return false;
  }
};

const loginWithSpotify = asyncHandler(async (req, res) => {
  const state = createAuthState();

  const url = getSpotifyAuthURL({ state });

  return res.redirect(url);
});

const spotifyCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const frontendURL = getFrontendUrl();
  const redirectUri = getSpotifyRedirectUri();

  if (error) {
    console.error("SPOTIFY CALLBACK ERROR PARAM:", error);
    return res.status(500).json({ error: String(error) });
  }

  if (!code) {
    throw new ApiError(400, "Authorization code missing");
  }

  if (!verifyAuthState(state)) {
    throw new ApiError(400, "State mismatch");
  }

  let tokenData;

  try {
    console.log("CODE:", code);
    console.log("REDIRECT_URI:", redirectUri);

    const tokenResponse = await axios.post(
      "https://accounts.spotify.com/api/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    console.log("TOKEN RESPONSE:", tokenResponse.data);

    tokenData = {
      accessToken: tokenResponse.data.access_token,
      refreshToken: tokenResponse.data.refresh_token,
      expiresIn: tokenResponse.data.expires_in,
      scope: tokenResponse.data.scope,
    };
  } catch (tokenError) {
    console.error("SPOTIFY TOKEN EXCHANGE ERROR:", {
      message: tokenError.message,
      status: tokenError.response?.status,
      data: tokenError.response?.data,
    });

    return res.status(500).json({ error: tokenError.message });
  }

  const spotifyScopes = (tokenData.scope || "")
    .split(" ")
    .map((scope) => scope.trim())
    .filter(Boolean);

  const missingScopes = REQUIRED_SPOTIFY_SCOPES.filter(
    (scope) => !spotifyScopes.includes(scope)
  );

  if (missingScopes.length) {
    return res.redirect(
      `${frontendURL}?error=missing_scopes&missing=${encodeURIComponent(
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

  const accessToken = generateAccessToken({
    userId: user._id,
    spotifyUserId: user.spotifyUserId,
  });

  const refreshToken = generateRefreshToken({
    userId: user._id,
    spotifyUserId: user.spotifyUserId,
  });

  res.cookie("accessToken", accessToken, {
    ...authCookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...authCookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.redirect(`${frontendURL}`);
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    ...authCookieOptions,
  });

  res.clearCookie("refreshToken", {
    ...authCookieOptions,
  });

  res.clearCookie("spotify_auth_state", {
    ...authCookieOptions,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export { loginWithSpotify, spotifyCallback, logout };