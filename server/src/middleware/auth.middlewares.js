import { ApiError } from "../utils/api-error.utils.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async-handler.utils.js";

const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const cookieToken = req.cookies?.accessToken;
  const headerToken = req.headers["x-access-token"];
  const queryToken = req.query?.accessToken;
  const bodyToken = req.body?.accessToken;

  const token = bearerToken || headerToken || cookieToken || queryToken || bodyToken;

  if (!token) {
    throw new ApiError(401, "Access token is missing");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      userId: decoded.userId,
      ...decoded,
    };
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired access token");
  }
});

export { authenticateToken };
