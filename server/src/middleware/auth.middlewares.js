import { ApiError } from "../utils/api-error.utils.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.utils.js";
import { generateAccessToken } from "../utils/jwt.utils.js";

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
};

const issueAccessTokenFromRefresh = (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is missing");
  }

  try {
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const newAccessToken = generateAccessToken({
      userId: decodedRefresh.userId,
      spotifyUserId: decodedRefresh.spotifyUserId,
    });

    res.cookie("accessToken", newAccessToken, {
      ...authCookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    req.user = {
      userId: decodedRefresh.userId,
      spotifyUserId: decodedRefresh.spotifyUserId,
    };

    return true;
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }
};

const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const cookieToken = req.cookies?.accessToken;

  const token = bearerToken || cookieToken;

  if (!token) {
    issueAccessTokenFromRefresh(req, res);
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = {
      userId: decoded.userId,
      spotifyUserId: decoded.spotifyUserId,
    };

    return next();
  } catch (err) {
    issueAccessTokenFromRefresh(req, res);
    return next();
  }
});

export { authenticateToken };