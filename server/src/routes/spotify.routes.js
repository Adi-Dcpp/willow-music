import { Router } from "express";
import {
  getTop,
  getTopTracks,
  getTopArtists,
} from "../controllers/spotify.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

// all routes protected
router.use(authenticateToken);

// main route
router.get("/", getTop);

// specific routes
router.get("/tracks", getTopTracks);
router.get("/artists", getTopArtists);

export default router;