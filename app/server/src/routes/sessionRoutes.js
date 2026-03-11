import express from "express";
import { createSession } from "../services/sessionService.js";
import { finalizeIngestionSession } from "../services/gazeIngestService.js";
import { finalizeFlightSession } from "../db/flightSessionModel.js";
import { liveSessions } from "../state/liveSessionState.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    req.log.info({ body: req.body }, "create session request received");

    const session = await createSession(req.body || {});

    req.log.info({ sessionId: session.sessionId }, "session created");
    res.status(201).json(session);
  } catch (err) {
    req.log.error({ err, body: req.body }, "create session failed");
    res.status(500).json({ error: err.message });
  }
});

router.post("/:sessionId/end", async (req, res) => {
  try {
    const { sessionId } = req.params;
    req.log.info({ sessionId }, "end session request received");

    const summary = await finalizeIngestionSession(sessionId);

    await finalizeFlightSession({
      sessionId,
      totalSamples: summary.totalSamples,
      totalFixations: summary.totalFixations,
      totalGazeDurationMs: summary.totalGazeDurationMs,
      sessionStatus: "COMPLETED",
    });

    liveSessions.delete(sessionId);

    req.log.info({ sessionId, summary }, "session ended");
    res.json({
      ok: true,
      ...summary,
      status: "COMPLETED",
    });
  } catch (err) {
    req.log.error({ err, params: req.params }, "end session failed");
    res.status(500).json({ error: err.message });
  }
});

export default router;