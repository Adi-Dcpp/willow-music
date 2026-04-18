import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import spotifyRoutes from "./routes/spotify.routes.js";
import snapshotRoutes from "./routes/snapshot.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import ogRoutes from "./routes/og.routes.js";
import { globalErrorHandler } from "./middleware/error.middlewares.js";
import { rateLimiter } from "./middleware/rateLimiter.middlewares.js";

const app = express();

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

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

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/top", spotifyRoutes);
app.use("/api/share", snapshotRoutes);
app.use("/api/playlist", playlistRoutes);
app.use("/api/og", ogRoutes);
/**
 * When frontend loads /share/:shareId, add:

<meta property="og:title" content="My Willow Snapshot" />
<meta property="og:image" content="https://yourapi.com/api/og/abc123" />
<meta property="og:type" content="website" />
 */

app.use(globalErrorHandler);

export default app;