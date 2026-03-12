/**
 * Module: app/server/src/controllers/sessionController.js
 * Layer: Backend
 * Purpose:
 * - Implements the sessionController unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

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