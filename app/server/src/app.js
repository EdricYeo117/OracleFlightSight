/**
 * Module: app/server/src/app.js
 * Layer: Backend
 * Purpose:
 * - Implements the app unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import express from "express";
import cors from "cors";
import requestLogger from "./middleware/requestLogger.js";
import logger from "./config/logger.js";

import sessionRoutes from "./routes/sessionRoutes.js";
import gazeRoutes from "./routes/gazeRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(requestLogger);

app.get("/health", (req, res) => {
  req.log.info("health check");
  res.json({ ok: true });
});

app.use("/api/sessions", sessionRoutes);
app.use("/api/gaze", gazeRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use((err, req, res, next) => {
  req.log.error(
    {
      err,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    "unhandled request error",
  );

  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;
