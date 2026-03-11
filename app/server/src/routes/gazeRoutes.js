import express from "express";
import { ingestBatch } from "../services/gazeIngestService.js";

const router = express.Router();

router.post("/batch", async (req, res) => {
  try {
    const { sessionId, samples } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    if (!Array.isArray(samples) || !samples.length) {
      return res.status(400).json({ error: "samples must be a non-empty array" });
    }

    const result = await ingestBatch({ sessionId, samples });
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Batch ingest failed:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;