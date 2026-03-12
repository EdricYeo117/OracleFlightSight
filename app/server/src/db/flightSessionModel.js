/**
 * Module: app/server/src/db/flightSessionModel.js
 * Layer: Backend
 * Purpose:
 * - Implements the flightSessionModel unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import oracledb from "oracledb";
import { getConnection } from "../config/db.js";
import logger from "../config/logger.js";

export async function insertFlightSession({
  sessionId,
  scenarioId = null,
  pilotId = null,
  sessionStatus = "ACTIVE",
  screenWidth = null,
  screenHeight = null,
  gridCols = 40,
  gridRows = 24,
  notes = null,
}) {
  logger.info(
    {
      sessionId,
      scenarioId,
      pilotId,
      sessionStatus,
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
    },
    "insertFlightSession start"
  );

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      INSERT INTO FLIGHT_SESSION (
        SESSION_ID,
        SCENARIO_ID,
        PILOT_ID,
        SESSION_STATUS,
        STARTED_AT,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        GRID_COLS,
        GRID_ROWS,
        TOTAL_SAMPLES,
        TOTAL_FIXATIONS,
        TOTAL_GAZE_DURATION_MS,
        NOTES
      ) VALUES (
        :sessionId,
        :scenarioId,
        :pilotId,
        :sessionStatus,
        CURRENT_TIMESTAMP,
        :screenWidth,
        :screenHeight,
        :gridCols,
        :gridRows,
        0,
        0,
        0,
        :notes
      )
      `,
      {
        sessionId,
        scenarioId,
        pilotId,
        sessionStatus,
        screenWidth,
        screenHeight,
        gridCols,
        gridRows,
        notes,
      },
      { autoCommit: true }
    );

    logger.info(
      { sessionId, rowsAffected: result.rowsAffected || 0 },
      "insertFlightSession complete"
    );
  } catch (err) {
    logger.error({ err, sessionId }, "insertFlightSession failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "insertFlightSession connection closed");
  }
}

export async function finalizeFlightSession({
  sessionId,
  totalSamples,
  totalFixations,
  totalGazeDurationMs,
  sessionStatus = "COMPLETED",
}) {
  logger.info(
    {
      sessionId,
      totalSamples,
      totalFixations,
      totalGazeDurationMs,
      sessionStatus,
    },
    "finalizeFlightSession start"
  );

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      UPDATE FLIGHT_SESSION
      SET
        SESSION_STATUS = :sessionStatus,
        ENDED_AT = CURRENT_TIMESTAMP,
        TOTAL_SAMPLES = :totalSamples,
        TOTAL_FIXATIONS = :totalFixations,
        TOTAL_GAZE_DURATION_MS = :totalGazeDurationMs
      WHERE SESSION_ID = :sessionId
      `,
      {
        sessionId,
        sessionStatus,
        totalSamples,
        totalFixations,
        totalGazeDurationMs,
      },
      { autoCommit: true }
    );

    logger.info(
      { sessionId, rowsAffected: result.rowsAffected || 0 },
      "finalizeFlightSession complete"
    );
  } catch (err) {
    logger.error({ err, sessionId }, "finalizeFlightSession failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "finalizeFlightSession connection closed");
  }
}

export async function updateFlightSessionTotals({
  sessionId,
  totalSamples,
  totalFixations,
  totalGazeDurationMs,
}) {
  logger.debug(
    {
      sessionId,
      totalSamples,
      totalFixations,
      totalGazeDurationMs,
    },
    "updateFlightSessionTotals start"
  );

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      UPDATE FLIGHT_SESSION
      SET
        TOTAL_SAMPLES = :totalSamples,
        TOTAL_FIXATIONS = :totalFixations,
        TOTAL_GAZE_DURATION_MS = :totalGazeDurationMs
      WHERE SESSION_ID = :sessionId
      `,
      {
        sessionId,
        totalSamples,
        totalFixations,
        totalGazeDurationMs,
      },
      { autoCommit: true }
    );

    logger.debug(
      { sessionId, rowsAffected: result.rowsAffected || 0 },
      "updateFlightSessionTotals complete"
    );
  } catch (err) {
    logger.error({ err, sessionId }, "updateFlightSessionTotals failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "updateFlightSessionTotals connection closed");
  }
}

export async function getFlightSessionById(sessionId) {
  logger.debug({ sessionId }, "getFlightSessionById start");

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT *
      FROM FLIGHT_SESSION
      WHERE SESSION_ID = :sessionId
      `,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    logger.info(
      {
        sessionId,
        found: !!result.rows?.[0],
      },
      "getFlightSessionById complete"
    );

    return result.rows?.[0] || null;
  } catch (err) {
    logger.error({ err, sessionId }, "getFlightSessionById failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "getFlightSessionById connection closed");
  }
}