import { Router } from "express";
import { startSession } from "../controllers/sessionController.js";

const router = Router();

router.post("/", startSession);

export default router;