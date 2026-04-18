import { Router } from "express";
import { generateOGImage } from "../controllers/og.controller.js";

const router = Router();

router.get("/:shareId", generateOGImage);

export default router;