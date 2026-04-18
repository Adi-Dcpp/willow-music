import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import spotifyRoutes from "./routes/spotify.routes.js";
import snapshotRoutes from "./routes/snapshot.routes.js";
import ogRoutes from "./routes/og.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import { globalErrorHandler } from "./middleware/error.middlewares.js";
import { rateLimiter } from "./middleware/rateLimiter.middlewares.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

const getAllowedOrigins = () => {
  if (process.env.FRONTEND_URL) {
    return isProduction
      ? [process.env.FRONTEND_URL]
      : [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"];
  }

  if (isProduction) {
    throw new Error("FRONTEND_URL is required in production");
  }

  return ["http://localhost:5173", "http://127.0.0.1:5173"];
};

if (process.env.TRUST_PROXY === "1" || process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = new Set(getAllowedOrigins());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(rateLimiter);

app.get("/", (req, res) => {
  res.send("Willow API is alive 🌿");
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ ok: true, service: "willow-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/me", userRoutes);
app.use("/api/top", spotifyRoutes);
app.use("/api/share", snapshotRoutes);
app.use("/api/snapshots", snapshotRoutes);
app.use("/api/og", ogRoutes);
app.use("/api/ai", aiRoutes);
/**
 * When frontend loads /share/:shareId, add:

<meta property="og:title" content="My Willow Snapshot" />
<meta property="og:image" content="https://yourapi.com/api/og/abc123" />
<meta property="og:type" content="website" />
 */

app.use(globalErrorHandler);

export default app;