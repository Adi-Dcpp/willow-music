import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import { globalErrorHandler } from "./middleware/error.middlewares.js";

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Willow API is alive 🌿");
});

app.use("/auth", authRoutes);

app.use(globalErrorHandler);

export default app;