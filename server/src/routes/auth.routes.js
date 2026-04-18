import { Router } from "express";
import {
  loginWithSpotify,
  spotifyCallback,
  logout,
  getSession,
} from "../controllers/auth.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.get("/spotify/login", loginWithSpotify);

router.get("/spotify/callback", spotifyCallback);

router.get("/me", authenticateToken, getSession);

router.get("/session", authenticateToken, getSession);

router.post("/logout", logout);

export default router;