import { Router } from "express";
import {
  loginWithSpotify,
  spotifyCallback,
  logout,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/spotify/login", loginWithSpotify);

router.get("/spotify/callback", spotifyCallback);

router.post("/logout", logout);

export default router;