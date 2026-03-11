import express from "express";
import cors from "cors";
import requestLogger from "./middleware/requestLogger.js";
import logger from "./config/logger.js";

import sessionRoutes from "./routes/sessionRoutes.js";
import gazeRoutes from "./routes/gazeRoutes.js";

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

app.use((err, req, res, next) => {
  req.log.error(
    {
      err,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    "unhandled request error"
  );

  res.status(500).json({
    error: "Internal server error",
  });
});

export default app;