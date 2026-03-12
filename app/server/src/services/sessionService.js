/**
 * Module: app/server/src/services/sessionService.js
 * Layer: Backend
 * Purpose:
 * - Implements the sessionService unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import logger from "../config/logger.js";
import { liveSessions } from "../state/liveSessionState.js";
import { insertFlightSession } from "../db/flightSessionModel.js";

export async function createSession({
  scenarioId = "demo-flight-sim",
  pilotId = "local-user",
  screenWidth = 0,
  screenHeight = 0,
  gridCols = 40,
  gridRows = 24,
  notes = null,
}) {
  const sessionId = `fs_${Date.now()}`;

  logger.info(
    {
      sessionId,
      scenarioId,
      pilotId,
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
      hasNotes: !!notes,
    },
    "createSession start"
  );

  try {
    await insertFlightSession({
      sessionId,
      scenarioId,
      pilotId,
      sessionStatus: "ACTIVE",
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
      notes,
    });

    const session = {
      sessionId,
      scenarioId,
      pilotId,
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
      startedAt: new Date().toISOString(),
      heatmap: new Map(),
      aoiCounts: {},
      bufferedSamples: [],
      fixationInsertBuffer: [],
      aoiAggregates: new Map(),
      ruleProgress: {},
      rules: [],
      currentFixation: null,
      totalSamples: 0,
      totalFixations: 0,
      totalGazeDurationMs: 0,
      lastUpdated: Date.now(),
    };

    liveSessions.set(sessionId, session);

    logger.info(
      {
        sessionId,
        liveSessionCount: liveSessions.size,
        startedAt: session.startedAt,
      },
      "createSession complete"
    );

    return {
      sessionId,
      scenarioId,
      pilotId,
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
      startedAt: session.startedAt,
      status: "ACTIVE",
    };
  } catch (err) {
    logger.error(
      {
        err,
        sessionId,
        scenarioId,
        pilotId,
      },
      "createSession failed"
    );
    throw err;
  }
}