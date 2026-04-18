import { Router } from "express";
import {
  getTop,
  getTopTracks,
  getTopArtists,
} from "../controllers/top.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// all routes protected
router.use(authenticateToken);

// main route
router.get("/", getTop);

// specific routes
router.get("/tracks", getTopTracks);
router.get("/artists", getTopArtists);

export default router;