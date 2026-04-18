import express from "express";
import helmet from "helmet";
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

// Security headers – applied before any routes.
// HSTS tells browsers to always use HTTPS for this origin (resolves Chrome Safe Browsing warnings
// on Render-hosted APIs that already terminate TLS at the edge).
app.use(
  helmet({
    // HSTS: 1 year, include subdomains, allow preload submission.
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    // CSP default-src 'none' is safe for a pure JSON API (no HTML served).
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    // Prevent browsers from MIME-sniffing the response type.
    xContentTypeOptions: true,
    // Disallow embedding in frames (clickjacking protection).
    xFrameOptions: { action: "deny" },
    // Suppress the X-Powered-By: Express header.
    hidePoweredBy: true,
    // Send a minimal Referer for cross-origin requests.
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    // Deny cross-origin resource sharing at the fetch-metadata level.
    crossOriginResourcePolicy: { policy: "same-origin" },
    // Not serving any resources that need cross-origin embedding.
    crossOriginEmbedderPolicy: false,
    // Disable DNS prefetching to avoid information leakage.
    dnsPrefetchControl: { allow: false },
    // Disable IE-specific download sniffing.
    xDownloadOptions: true,
    // Disable permissive cross-domain reads (Adobe Flash/PDF legacy).
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    // Legacy XSS filter – disabled to avoid filter-bypass attacks in old IE.
    xXssProtection: false,
    // Browser-side origin isolation.
    originAgentCluster: true,
  })
);

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