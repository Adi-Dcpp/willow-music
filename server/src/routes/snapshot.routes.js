import { Router } from "express";
import { createSnapshot, getSnapshot, deleteSnapshot } from "../controllers/snapshot.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, createSnapshot);
router.get("/:shareId", getSnapshot); // public
router.delete("/:shareId", authenticateToken, deleteSnapshot);
export default router;