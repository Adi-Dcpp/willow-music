import { Router } from "express";
import {
  loginWithSpotify,
  spotifyCallback,
} from "../controllers/auth.controller.js";

const router = Router();

router.get("/spotify/login", loginWithSpotify);

router.get("/spotify/callback", spotifyCallback);

export default router;