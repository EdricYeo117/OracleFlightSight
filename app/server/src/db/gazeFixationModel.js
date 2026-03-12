/**
 * Module: app/server/src/db/gazeFixationModel.js
 * Layer: Backend
 * Purpose:
 * - Implements the gazeFixationModel unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import { getConnection } from "../config/db.js";
import logger from "../config/logger.js";

export async function insertGazeFixations(fixations) {
  if (!fixations?.length) {
    logger.debug("insertGazeFixations skipped: no fixations provided");
    return 0;
  }

  const sessionId = fixations[0]?.sessionId ?? null;

  logger.debug(
    {
      sessionId,
      fixationCount: fixations.length,
    },
    "insertGazeFixations start"
  );

  const conn = await getConnection();
  try {
    const sql = `
      INSERT INTO GAZE_FIXATION (
        SESSION_ID,
        AOI,
        START_TS_MS,
        END_TS_MS,
        DURATION_MS,
        CENTER_X,
        CENTER_Y,
        CENTER_NX,
        CENTER_NY,
        GRID_X,
        GRID_Y,
        SAMPLE_COUNT,
        IS_VERIFIED_LOOK,
        VERIFY_RULE_ID
      ) VALUES (
        :sessionId,
        :aoi,
        :startTsMs,
        :endTsMs,
        :durationMs,
        :centerX,
        :centerY,
        :centerNx,
        :centerNy,
        :gridX,
        :gridY,
        :sampleCount,
        :isVerifiedLook,
        :verifyRuleId
      )
    `;

    const filteredFixations = fixations.filter(
      (f) =>
        f &&
        Number.isFinite(f.startTsMs) &&
        Number.isFinite(f.endTsMs) &&
        Number.isFinite(f.durationMs) &&
        f.endTsMs >= f.startTsMs &&
        f.durationMs > 0 &&
        f.sampleCount >= 2
    );

    if (filteredFixations.length !== fixations.length) {
      logger.warn(
        {
          sessionId,
          originalCount: fixations.length,
          validCount: filteredFixations.length,
          droppedCount: fixations.length - filteredFixations.length,
        },
        "insertGazeFixations dropped invalid fixations before insert"
      );
    }

    const binds = filteredFixations.map((f) => ({
      sessionId: f.sessionId,
      aoi: f.aoi ?? null,
      startTsMs: f.startTsMs,
      endTsMs: f.endTsMs,
      durationMs: f.durationMs,
      centerX: f.centerX ?? null,
      centerY: f.centerY ?? null,
      centerNx: f.centerNx ?? null,
      centerNy: f.centerNy ?? null,
      gridX: f.gridX ?? null,
      gridY: f.gridY ?? null,
      sampleCount: f.sampleCount ?? 0,
      isVerifiedLook: f.isVerifiedLook ?? 0,
      verifyRuleId: f.verifyRuleId ?? null,
    }));

    if (!binds.length) {
      logger.debug({ sessionId }, "insertGazeFixations skipped: no valid binds");
      return 0;
    }

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    logger.info(
      {
        sessionId,
        fixationCount: binds.length,
        rowsAffected: result.rowsAffected || 0,
      },
      "insertGazeFixations complete"
    );

    return result.rowsAffected || 0;
  } catch (err) {
    logger.error(
      {
        err,
        sessionId,
        fixationCount: fixations.length,
      },
      "insertGazeFixations failed"
    );
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "insertGazeFixations connection closed");
  }
}