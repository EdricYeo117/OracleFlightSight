// server/src/controllers/analyticsController.js
import logger from "../config/logger.js";
import {
  listAnalyticsSessions,
  getSessionDashboard,
} from "../services/analyticsService.js";

export async function listAnalyticsSessionsController(req, res) {
  logger.info("listAnalyticsSessionsController start");

  try {
    const sessions = await listAnalyticsSessions();

    logger.info(
      { sessionCount: sessions.length },
      "listAnalyticsSessionsController complete",
    );

    res.json({ sessions });
  } catch (err) {
    logger.error({ err }, "listAnalyticsSessionsController failed");
    res.status(500).json({ error: "Failed to load analytics sessions" });
  }
}

export async function getSessionDashboardController(req, res) {
  const { sessionId } = req.params;

  logger.info({ sessionId }, "getSessionDashboardController start");

  try {
    const dashboard = await getSessionDashboard(sessionId);

    if (!dashboard) {
      logger.warn({ sessionId }, "getSessionDashboardController not found");
      return res.status(404).json({ error: "Session not found" });
    }

    logger.info({ sessionId }, "getSessionDashboardController complete");
    res.json(dashboard);
  } catch (err) {
    logger.error({ err, sessionId }, "getSessionDashboardController failed");
    res.status(500).json({ error: "Failed to load session dashboard" });
  }
}
