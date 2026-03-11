import express from "express";
import { createSession } from "../services/sessionService.js";
import { finalizeIngestionSession } from "../services/gazeIngestService.js";
import { finalizeFlightSession } from "../db/flightSessionModel.js";
import { liveSessions } from "../state/liveSessionState.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const session = await createSession(req.body || {});
    res.status(201).json(session);
  } catch (err) {
    console.error("Create session failed:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const summary = await finalizeIngestionSession(sessionId);

    await finalizeFlightSession({
      sessionId,
      totalSamples: summary.totalSamples,
      totalFixations: summary.totalFixations,
      totalGazeDurationMs: summary.totalGazeDurationMs,
      sessionStatus: "COMPLETED",
    });

    liveSessions.delete(sessionId);

    res.json({
      ok: true,
      ...summary,
      status: "COMPLETED",
    });
  } catch (err) {
    console.error("End session failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;