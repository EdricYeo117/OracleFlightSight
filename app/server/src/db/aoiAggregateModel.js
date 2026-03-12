import { getConnection } from "../config/db.js";
import oracledb from "oracledb";
import logger from "../config/logger.js";

export async function upsertAoiAggregates(sessionId, aggregates) {
  if (!aggregates?.length) {
    logger.debug({ sessionId }, "upsertAoiAggregates skipped: no aggregates");
    return 0;
  }

  logger.debug(
    {
      sessionId,
      aggregateCount: aggregates.length,
      aois: aggregates.map((a) => a.aoi),
    },
    "upsertAoiAggregates start",
  );

  const conn = await getConnection();
  try {
    const sql = `
      MERGE INTO AOI_AGGREGATE tgt
      USING (
        SELECT
          :sessionId AS SESSION_ID,
          :aoi AS AOI,
          :sampleCount AS SAMPLE_COUNT,
          :fixationCount AS FIXATION_COUNT,
          :totalDwellMs AS TOTAL_DWELL_MS,
          :avgFixationMs AS AVG_FIXATION_MS,
          :longestFixationMs AS LONGEST_FIXATION_MS,
          :firstLookTsMs AS FIRST_LOOK_TS_MS,
          :lastLookTsMs AS LAST_LOOK_TS_MS,
          :lookVerifiedCount AS LOOK_VERIFIED_COUNT,
          :visitCount AS VISIT_COUNT,
          :avgVisitMs AS AVG_VISIT_MS,
          :longestVisitMs AS LONGEST_VISIT_MS
        FROM dual
      ) src
      ON (tgt.SESSION_ID = src.SESSION_ID AND tgt.AOI = src.AOI)
      WHEN MATCHED THEN UPDATE SET
        tgt.SAMPLE_COUNT = src.SAMPLE_COUNT,
        tgt.FIXATION_COUNT = src.FIXATION_COUNT,
        tgt.TOTAL_DWELL_MS = src.TOTAL_DWELL_MS,
        tgt.AVG_FIXATION_MS = src.AVG_FIXATION_MS,
        tgt.LONGEST_FIXATION_MS = src.LONGEST_FIXATION_MS,
        tgt.FIRST_LOOK_TS_MS = src.FIRST_LOOK_TS_MS,
        tgt.LAST_LOOK_TS_MS = src.LAST_LOOK_TS_MS,
        tgt.LOOK_VERIFIED_COUNT = src.LOOK_VERIFIED_COUNT,
        tgt.VISIT_COUNT = src.VISIT_COUNT,
        tgt.AVG_VISIT_MS = src.AVG_VISIT_MS,
        tgt.LONGEST_VISIT_MS = src.LONGEST_VISIT_MS,
        tgt.LAST_UPDATED = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN INSERT (
        SESSION_ID,
        AOI,
        SAMPLE_COUNT,
        FIXATION_COUNT,
        TOTAL_DWELL_MS,
        AVG_FIXATION_MS,
        LONGEST_FIXATION_MS,
        FIRST_LOOK_TS_MS,
        LAST_LOOK_TS_MS,
        LOOK_VERIFIED_COUNT,
        VISIT_COUNT,
        AVG_VISIT_MS,
        LONGEST_VISIT_MS,
        LAST_UPDATED
      ) VALUES (
        src.SESSION_ID,
        src.AOI,
        src.SAMPLE_COUNT,
        src.FIXATION_COUNT,
        src.TOTAL_DWELL_MS,
        src.AVG_FIXATION_MS,
        src.LONGEST_FIXATION_MS,
        src.FIRST_LOOK_TS_MS,
        src.LAST_LOOK_TS_MS,
        src.LOOK_VERIFIED_COUNT,
        src.VISIT_COUNT,
        src.AVG_VISIT_MS,
        src.LONGEST_VISIT_MS,
        CURRENT_TIMESTAMP
      )
    `;

    const binds = aggregates.map((a) => ({
      sessionId,
      aoi: a.aoi,
      sampleCount: a.sampleCount ?? 0,
      fixationCount: a.fixationCount ?? 0,
      totalDwellMs: a.totalDwellMs ?? 0,
      avgFixationMs: a.avgFixationMs ?? 0,
      longestFixationMs: a.longestFixationMs ?? 0,
      firstLookTsMs: a.firstLookTsMs ?? null,
      lastLookTsMs: a.lastLookTsMs ?? null,
      lookVerifiedCount: a.lookVerifiedCount ?? 0,
      visitCount: a.visitCount ?? 0,
      avgVisitMs: a.avgVisitMs ?? 0,
      longestVisitMs: a.longestVisitMs ?? 0,
    }));

    const result = await conn.executeMany(sql, binds, { autoCommit: true });

    logger.info(
      {
        sessionId,
        aggregateCount: aggregates.length,
        rowsAffected: result.rowsAffected || 0,
      },
      "upsertAoiAggregates complete",
    );

    return result.rowsAffected || 0;
  } catch (err) {
    logger.error({ err, sessionId }, "upsertAoiAggregates failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "upsertAoiAggregates connection closed");
  }
}

export async function getAoiAggregatesBySession(sessionId) {
  logger.debug({ sessionId }, "getAoiAggregatesBySession start");

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        SESSION_ID,
        AOI,
        SAMPLE_COUNT,
        FIXATION_COUNT,
        TOTAL_DWELL_MS,
        AVG_FIXATION_MS,
        LONGEST_FIXATION_MS,
        FIRST_LOOK_TS_MS,
        LAST_LOOK_TS_MS,
        LOOK_VERIFIED_COUNT,
        VISIT_COUNT,
        AVG_VISIT_MS,
        LONGEST_VISIT_MS,
        LAST_UPDATED
      FROM AOI_AGGREGATE
      WHERE SESSION_ID = :sessionId
      ORDER BY TOTAL_DWELL_MS DESC, FIXATION_COUNT DESC
      `,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    logger.info(
      { sessionId, aggregateCount: result.rows?.length || 0 },
      "getAoiAggregatesBySession complete",
    );

    return result.rows || [];
  } catch (err) {
    logger.error({ err, sessionId }, "getAoiAggregatesBySession failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "getAoiAggregatesBySession connection closed");
  }
}
