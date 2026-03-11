import { createSession } from "../services/sessionService.js";

export async function startSession(req, res) {
  try {
    const result = await createSession(req.body || {});
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      error: "Failed to start session",
      details: error.message
    });
  }
}