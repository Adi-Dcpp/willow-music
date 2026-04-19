import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/index.db.js";

const PORT = process.env.PORT || 5000;

const validateProductionEnv = () => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const requiredVars = [
    "MONGODB_URI",
    "BACKEND_URL",
    "SPOTIFY_REDIRECT_URI",
    "SPOTIFY_CLIENT_ID",
    "SPOTIFY_CLIENT_SECRET",
    "FRONTEND_URL",
    "ACCESS_TOKEN_SECRET",
    "REFRESH_TOKEN_SECRET",
  ];

  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length) {
    throw new Error(`Missing required production env vars: ${missing.join(", ")}`);
  }
};

validateProductionEnv();

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🌿 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
  });