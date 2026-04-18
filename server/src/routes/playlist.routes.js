import { Router } from "express";
import { createPlaylistFromTop } from "../controllers/playlist.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.post("/from-top", authenticateToken, createPlaylistFromTop);

export default router;