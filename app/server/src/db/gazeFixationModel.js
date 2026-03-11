import { getConnection } from "../config/db.js";

export async function insertGazeFixations(fixations) {
  if (!fixations?.length) return 0;

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

    const binds = fixations.map((f) => ({
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

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}