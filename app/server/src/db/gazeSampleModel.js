import { getConnection } from "../config/db.js";

export async function insertGazeSamples(samples) {
  if (!samples?.length) return 0;

  const conn = await getConnection();
  try {
    const sql = `
      INSERT INTO GAZE_SAMPLE (
        SESSION_ID,
        TS_MS,
        ELAPSED_MS,
        X,
        Y,
        NX,
        NY,
        AOI,
        CONFIDENCE,
        GRID_X,
        GRID_Y,
        IS_VALID,
        INVALID_REASON
      ) VALUES (
        :sessionId,
        :tsMs,
        :elapsedMs,
        :x,
        :y,
        :nx,
        :ny,
        :aoi,
        :confidence,
        :gridX,
        :gridY,
        :isValid,
        :invalidReason
      )
    `;

    const binds = samples.map((s) => ({
      sessionId: s.sessionId,
      tsMs: s.tsMs,
      elapsedMs: s.elapsedMs ?? null,
      x: s.x,
      y: s.y,
      nx: s.nx ?? null,
      ny: s.ny ?? null,
      aoi: s.aoi ?? null,
      confidence: s.confidence ?? null,
      gridX: s.gridX ?? null,
      gridY: s.gridY ?? null,
      isValid: s.isValid ?? 1,
      invalidReason: s.invalidReason ?? null,
    }));

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}