import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.get("/", authenticateToken, getCurrentUser);

router.get("/me", authenticateToken, getCurrentUser);

export default router;