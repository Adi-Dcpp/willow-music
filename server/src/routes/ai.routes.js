import { Router } from "express";
import { reviewSummary } from "../controllers/ai.controller.js";
import { authenticateToken } from "../middleware/auth.middlewares.js";

const router = Router();

router.use(authenticateToken);
router.post("/review", reviewSummary);

export default router;
