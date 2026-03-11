import express from "express";
import cors from "cors";

import sessionRoutes from "./routes/sessionRoutes.js";
import gazeRoutes from "./routes/gazeRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/sessions", sessionRoutes);
app.use("/api/gaze", gazeRoutes);

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

export default app;