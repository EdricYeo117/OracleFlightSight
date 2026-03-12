import { getConnection } from "../config/db.js";
import oracledb from "oracledb";
import logger from "../config/logger.js";

export async function insertAoiVisits(visits) {
  if (!visits?.length) {
    logger.debug("insertAoiVisits skipped: no visits provided");
    return 0;
  }

  const sessionId = visits[0]?.sessionId ?? null;

  logger.debug(
    {
      sessionId,
      visitCount: visits.length,
    },
    "insertAoiVisits start",
  );

  const conn = await getConnection();
  try {
    const sql = `
      INSERT INTO AOI_VISIT (
        SESSION_ID,
        AOI,
        START_TS_MS,
        END_TS_MS,
        DURATION_MS,
        FIXATION_COUNT,
        VISIT_ORDER_NO
      ) VALUES (
        :sessionId,
        :aoi,
        :startTsMs,
        :endTsMs,
        :durationMs,
        :fixationCount,
        :visitOrderNo
      )
    `;

    const validVisits = visits.filter(
      (v) =>
        v &&
        v.aoi &&
        v.aoi !== "NONE" &&
        Number.isFinite(v.startTsMs) &&
        Number.isFinite(v.endTsMs) &&
        Number.isFinite(v.durationMs) &&
        v.endTsMs >= v.startTsMs &&
        v.durationMs >= 0,
    );

    const binds = validVisits.map((v) => ({
      sessionId: v.sessionId,
      aoi: v.aoi,
      startTsMs: v.startTsMs,
      endTsMs: v.endTsMs,
      durationMs: v.durationMs,
      fixationCount: v.fixationCount ?? 0,
      visitOrderNo: v.visitOrderNo ?? null,
    }));

    if (!binds.length) {
      logger.debug({ sessionId }, "insertAoiVisits skipped: no valid binds");
      return 0;
    }

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    logger.info(
      {
        sessionId,
        visitCount: binds.length,
        rowsAffected: result.rowsAffected || 0,
      },
      "insertAoiVisits complete",
    );

    return result.rowsAffected || 0;
  } catch (err) {
    logger.error({ err, sessionId }, "insertAoiVisits failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "insertAoiVisits connection closed");
  }
}

export async function getAoiVisitsBySession(sessionId) {
  logger.debug({ sessionId }, "getAoiVisitsBySession start");

  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        VISIT_ID,
        SESSION_ID,
        AOI,
        START_TS_MS,
        END_TS_MS,
        DURATION_MS,
        FIXATION_COUNT,
        VISIT_ORDER_NO,
        CREATED_AT
      FROM AOI_VISIT
      WHERE SESSION_ID = :sessionId
      ORDER BY START_TS_MS, VISIT_ID
      `,
      { sessionId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT },
    );

    logger.info(
      {
        sessionId,
        visitCount: result.rows?.length || 0,
      },
      "getAoiVisitsBySession complete",
    );

    return result.rows || [];
  } catch (err) {
    logger.error({ err, sessionId }, "getAoiVisitsBySession failed");
    throw err;
  } finally {
    await conn.close();
    logger.debug({ sessionId }, "getAoiVisitsBySession connection closed");
  }
}
