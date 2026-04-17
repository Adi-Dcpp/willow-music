import { Router } from "express";
import {
  getTopTracks,
  getTopArtists,
} from "../controllers/spotify.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.get("/top-tracks", authenticateToken, getTopTracks);

router.get("/top-artists", authenticateToken, getTopArtists);

export default router;