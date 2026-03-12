// server/src/routes/analyticsRoutes.js
import express from "express";
import {
  listAnalyticsSessionsController,
  getSessionDashboardController,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/sessions", listAnalyticsSessionsController);
router.get("/sessions/:sessionId/dashboard", getSessionDashboardController);

export default router;
