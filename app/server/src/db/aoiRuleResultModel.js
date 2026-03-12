/**
 * Module: app/server/src/db/aoiRuleResultModel.js
 * Layer: Backend
 * Purpose:
 * - Implements the aoiRuleResultModel unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import { getConnection } from "../config/db.js";
import oracledb from "oracledb";
import logger from "../config/logger.js";

export async function upsertAoiRuleResults(sessionId, results) {
  if (!results?.length) {
    logger.debug({ sessionId }, "upsertAoiRuleResults skipped: no results");
    return 0;
  }

  logger.debug(
    {
      sessionId,
      resultCount: results.length,
      ruleIds: results.map((r) => r.ruleId),
    },
    "upsertAoiRuleResults start",
  );

  const conn = await getConnection();
  try {
    const sql = `
      MERGE INTO AOI_RULE_RESULT tgt
      USING (
        SELECT
          :sessionId AS SESSION_ID,
          :ruleId AS RULE_ID,
          :aoi AS AOI,
          :passed AS PASSED,
          :actualDwellMs AS ACTUAL_DWELL_MS,
          :actualFixationCount AS ACTUAL_FIXATION_COUNT,
          :longestFixationMs AS LONGEST_FIXATION_MS,
          :firstSatisfiedTsMs AS FIRST_SATISFIED_TS_MS
        FROM dual
      ) src
      ON (tgt.SESSION_ID = src.SESSION_ID AND tgt.RULE_ID = src.RULE_ID)
      WHEN MATCHED THEN UPDATE SET
        tgt.AOI = src.AOI,
        tgt.PASSED = src.PASSED,
        tgt.ACTUAL_DWELL_MS = src.ACTUAL_DWELL_MS,
        tgt.ACTUAL_FIXATION_COUNT = src.ACTUAL_FIXATION_COUNT,
        tgt.LONGEST_FIXATION_MS = src.LONGEST_FIXATION_MS,
        tgt.FIRST_SATISFIED_TS_MS = src.FIRST_SATISFIED_TS_MS,
        tgt.EVALUATED_AT = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN INSERT (
        SESSION_ID,
        RULE_ID,
        AOI,
        PASSED,
        ACTUAL_DWELL_MS,
        ACTUAL_FIXATION_COUNT,
        LONGEST_FIXATION_MS,
        FIRST_SATISFIED_TS_MS,
        EVALUATED_AT
      ) VALUES (
        src.SESSION_ID,
        src.RULE_ID,
        src.AOI,
        src.PASSED,
        src.ACTUAL_DWELL_MS,
        src.ACTUAL_FIXATION_COUNT,
        src.LONGEST_FIXATION_MS,
        src.FIRST_SATISFIED_TS_MS,
        CURRENT_TIMESTAMP
      )
    `;

    const binds = results.map((r) => ({
      sessionId,
      ruleId: r.ruleId,
      aoi: r.aoi,
      passed: r.passed ? 1 : 0,
      actualDwellMs: r.actualDwellMs ?? 0,
      actualFixationCount: r.actualFixationCount ?? 0,
      longestFixationMs: r.longestFixationMs ?? 0,
      firstSatisfiedTsMs: r.firstSatisfiedTsMs ?? null,
    }));

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    logger.info(
      {
        sessionId,
        resultCount: results.length,
        rowsAffected: result.rowsAffected || 0,
      },
      "upsertAoiRuleResults complete",
    );

    return result.rowsAffected || 0;
  } catch (err) {
    logger.error(
      { err, sessionId, resultCount: results.length },
      "upsertAoiRuleResults failed",
    );
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "upsertAoiRuleResults connection closed");
  }
}

export async function getAoiRuleResultsBySession(sessionId) {
  logger.debug({ sessionId }, "getAoiRuleResultsBySession start");

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        RESULT_ID,
        SESSION_ID,
        RULE_ID,
        AOI,
        PASSED,
        ACTUAL_DWELL_MS,
        ACTUAL_FIXATION_COUNT,
        LONGEST_FIXATION_MS,
        FIRST_SATISFIED_TS_MS,
        EVALUATED_AT
      FROM AOI_RULE_RESULT
      WHERE SESSION_ID = :sessionId
      ORDER BY RULE_ID
      `,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    logger.info(
      {
        sessionId,
        resultCount: result.rows?.length || 0,
      },
      "getAoiRuleResultsBySession complete",
    );

    return result.rows || [];
  } catch (err) {
    logger.error({ err, sessionId }, "getAoiRuleResultsBySession failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "getAoiRuleResultsBySession connection closed");
  }
}
