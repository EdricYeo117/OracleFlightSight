import { getConnection } from "../config/db.js";

export async function upsertAoiAggregates(sessionId, aggregates) {
  if (!aggregates?.length) return 0;

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
          :lookVerifiedCount AS LOOK_VERIFIED_COUNT
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
    }));

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

export async function getAoiAggregatesBySession(sessionId) {
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
        LAST_UPDATED
      FROM AOI_AGGREGATE
      WHERE SESSION_ID = :sessionId
      ORDER BY TOTAL_DWELL_MS DESC, FIXATION_COUNT DESC
      `,
      { sessionId },
      { outFormat: 4002 }
    );

    return result.rows;
  } finally {
    await conn.close();
  }
}