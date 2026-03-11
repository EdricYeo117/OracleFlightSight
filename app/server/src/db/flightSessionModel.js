import oracledb from "oracledb";
import { getConnection } from "../config/db.js";

export async function insertFlightSession({
  sessionId,
  scenarioId,
  pilotId,
  sessionStatus = "ACTIVE",
  screenWidth,
  screenHeight,
  gridCols = 40,
  gridRows = 24,
  notes = null,
}) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `
      INSERT INTO FLIGHT_SESSION (
        SESSION_ID,
        SCENARIO_ID,
        PILOT_ID,
        SESSION_STATUS,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        GRID_COLS,
        GRID_ROWS,
        NOTES
      ) VALUES (
        :sessionId,
        :scenarioId,
        :pilotId,
        :sessionStatus,
        :screenWidth,
        :screenHeight,
        :gridCols,
        :gridRows,
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

    return {
      sessionId,
      scenarioId,
      pilotId,
      sessionStatus,
      screenWidth,
      screenHeight,
      gridCols,
      gridRows,
      notes,
    };
  } finally {
    await conn.close();
  }
}

export async function getFlightSessionById(sessionId) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        SESSION_ID,
        SCENARIO_ID,
        PILOT_ID,
        SESSION_STATUS,
        STARTED_AT,
        ENDED_AT,
        SCREEN_WIDTH,
        SCREEN_HEIGHT,
        GRID_COLS,
        GRID_ROWS,
        TOTAL_SAMPLES,
        TOTAL_FIXATIONS,
        TOTAL_GAZE_DURATION_MS,
        NOTES
      FROM FLIGHT_SESSION
      WHERE SESSION_ID = :sessionId
      `,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0] || null;
  } finally {
    await conn.close();
  }
}

export async function endFlightSession(sessionId) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      UPDATE FLIGHT_SESSION
      SET
        SESSION_STATUS = 'COMPLETED',
        ENDED_AT = CURRENT_TIMESTAMP
      WHERE SESSION_ID = :sessionId
      `,
      { sessionId },
      { autoCommit: true }
    );

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

export async function updateFlightSessionTotals({
  sessionId,
  totalSamples,
  totalFixations,
  totalGazeDurationMs,
  sessionStatus = null,
}) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `
      UPDATE FLIGHT_SESSION
      SET
        TOTAL_SAMPLES = :totalSamples,
        TOTAL_FIXATIONS = :totalFixations,
        TOTAL_GAZE_DURATION_MS = :totalGazeDurationMs,
        SESSION_STATUS = COALESCE(:sessionStatus, SESSION_STATUS)
      WHERE SESSION_ID = :sessionId
      `,
      {
        sessionId,
        totalSamples,
        totalFixations,
        totalGazeDurationMs,
        sessionStatus,
      },
      { autoCommit: true }
    );
  } finally {
    await conn.close();
  }
}