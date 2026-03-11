import { getConnection } from "../config/db.js";

export async function upsertHeatmapCellAggregates(sessionId, cells) {
  if (!cells?.length) return 0;

  const conn = await getConnection();
  try {
    const sql = `
      MERGE INTO HEATMAP_CELL_AGGREGATE tgt
      USING (
        SELECT
          :sessionId AS SESSION_ID,
          :gridX AS GRID_X,
          :gridY AS GRID_Y,
          :sampleCount AS SAMPLE_COUNT,
          :totalDwellMs AS TOTAL_DWELL_MS,
          :fixationCount AS FIXATION_COUNT
        FROM dual
      ) src
      ON (
        tgt.SESSION_ID = src.SESSION_ID
        AND tgt.GRID_X = src.GRID_X
        AND tgt.GRID_Y = src.GRID_Y
      )
      WHEN MATCHED THEN UPDATE SET
        tgt.SAMPLE_COUNT = src.SAMPLE_COUNT,
        tgt.TOTAL_DWELL_MS = src.TOTAL_DWELL_MS,
        tgt.FIXATION_COUNT = src.FIXATION_COUNT,
        tgt.LAST_UPDATED = CURRENT_TIMESTAMP
      WHEN NOT MATCHED THEN INSERT (
        SESSION_ID,
        GRID_X,
        GRID_Y,
        SAMPLE_COUNT,
        TOTAL_DWELL_MS,
        FIXATION_COUNT,
        LAST_UPDATED
      ) VALUES (
        src.SESSION_ID,
        src.GRID_X,
        src.GRID_Y,
        src.SAMPLE_COUNT,
        src.TOTAL_DWELL_MS,
        src.FIXATION_COUNT,
        CURRENT_TIMESTAMP
      )
    `;

    const binds = cells.map((c) => ({
      sessionId,
      gridX: c.gridX,
      gridY: c.gridY,
      sampleCount: c.sampleCount ?? 0,
      totalDwellMs: c.totalDwellMs ?? 0,
      fixationCount: c.fixationCount ?? 0,
    }));

    const result = await conn.executeMany(sql, binds, {
      autoCommit: true,
    });

    return result.rowsAffected || 0;
  } finally {
    await conn.close();
  }
}

export async function getHeatmapCellsBySession(sessionId) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `
      SELECT
        SESSION_ID,
        GRID_X,
        GRID_Y,
        SAMPLE_COUNT,
        TOTAL_DWELL_MS,
        FIXATION_COUNT,
        LAST_UPDATED
      FROM HEATMAP_CELL_AGGREGATE
      WHERE SESSION_ID = :sessionId
      ORDER BY TOTAL_DWELL_MS DESC, SAMPLE_COUNT DESC
      `,
      { sessionId },
      { outFormat: 4002 }
    );

    return result.rows;
  } finally {
    await conn.close();
  }
}