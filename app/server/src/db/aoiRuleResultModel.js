import { getConnection } from "../config/db.js";

export async function upsertAoiRuleResults(sessionId, results) {
  if (!results?.length) return 0;

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
          :firstSatisfiedTsMs AS FIRST_SATISFIED_TS_MS
        FROM dual
      ) src
      ON (tgt.SESSION_ID = src.SESSION_ID AND tgt.RULE_ID = src.RULE_ID)
      WHEN MATCHED THEN UPDATE SET
        tgt.AOI = src.AOI,
        tgt.PASSED = src.PASSED,
        tgt.ACTUAL_DWELL_MS = src.ACTUAL_DWELL_MS,
        tgt.ACTUAL_FIXATION_COUNT = src.ACTUAL_FIXATION_COUNT,
        tgt.FIRST_SATISFIED_TS_MS = src.FIRST_SATISFIED_TS_MS,
        tgt.EVALUATED_AT = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN INSERT (
        SESSION_ID,
        RULE_ID,
        AOI,
        PASSED,
        ACTUAL_DWELL_MS,
        ACTUAL_FIXATION_COUNT,
        FIRST_SATISFIED_TS_MS,
        EVALUATED_AT
      ) VALUES (
        src.SESSION_ID,
        src.RULE_ID,
        src.AOI,
        src.PASSED,
        src.ACTUAL_DWELL_MS,
        src.ACTUAL_FIXATION_COUNT,
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
      firstSatisfiedTsMs: r.firstSatisfiedTsMs ?? null,
    }));

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

export async function getAoiRuleResultsBySession(sessionId) {
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
        FIRST_SATISFIED_TS_MS,
        EVALUATED_AT
      FROM AOI_RULE_RESULT
      WHERE SESSION_ID = :sessionId
      ORDER BY RULE_ID
      `,
      { sessionId },
      { outFormat: 4002 }
    );

    return result.rows;
  } finally {
    await conn.close();
  }
}