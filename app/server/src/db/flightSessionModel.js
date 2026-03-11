import oracledb from "oracledb";
import { getConnection } from "../config/db.js";

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
  const conn = await getConnection();
  try {
    await conn.execute(
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
  } finally {
    await conn.close();
  }
}

export async function finalizeFlightSession({
  sessionId,
  totalSamples,
  totalFixations,
  totalGazeDurationMs,
  sessionStatus = "COMPLETED",
}) {
  const conn = await getConnection();
  try {
    await conn.execute(
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
  } finally {
    await conn.close();
  }
}

export async function updateFlightSessionTotals({
  sessionId,
  totalSamples,
  totalFixations,
  totalGazeDurationMs,
}) {
  const conn = await getConnection();
  try {
    await conn.execute(
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
  } finally {
    await conn.close();
  }
}

export async function getFlightSessionById(sessionId) {
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
    return result.rows?.[0] || null;
  } finally {
    await conn.close();
  }
}