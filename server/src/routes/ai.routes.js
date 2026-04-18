import { Router } from "express";
import { generateAIReview } from "../controllers/ai.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.use(authenticateToken);

router.post("/review", generateAIReview);

export default router;
