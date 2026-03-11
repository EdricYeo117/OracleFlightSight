import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import gazeRoutes from "./routes/gazeRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN
  })
);

app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/flight-sessions", sessionRoutes);
app.use("/api/gaze-samples", gazeRoutes);

export default app;