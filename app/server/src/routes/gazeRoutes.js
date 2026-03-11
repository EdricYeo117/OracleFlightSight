import express from "express";
import { ingestBatch } from "../services/gazeIngestService.js";

const router = express.Router();

router.post("/batch", async (req, res) => {
  try {
    const { sessionId, samples } = req.body || {};

    req.log.info(
      {
        sessionId,
        sampleCount: Array.isArray(samples) ? samples.length : 0,
      },
      "gaze batch received"
    );

    if (!sessionId) {
      req.log.warn("batch rejected: missing sessionId");
      return res.status(400).json({ error: "sessionId is required" });
    }

    if (!Array.isArray(samples) || !samples.length) {
      req.log.warn({ sessionId }, "batch rejected: empty samples");
      return res
        .status(400)
        .json({ error: "samples must be a non-empty array" });
    }

    const result = await ingestBatch({ sessionId, samples });

    req.log.info(
      {
        sessionId,
        ingested: result.ingested,
        totalSamples: result.totalSamples,
        totalFixations: result.totalFixations,
      },
      "gaze batch processed"
    );

    res.json({ ok: true, ...result });
  } catch (err) {
    req.log.error(
      {
        err,
        body: {
          sessionId: req.body?.sessionId,
          sampleCount: Array.isArray(req.body?.samples)
            ? req.body.samples.length
            : 0,
        },
      },
      "batch ingest failed"
    );
    res.status(500).json({ error: err.message });
  }
});

export default router;