import oracledb from "oracledb";
import { getConnection } from "../config/db.js";

function normalizeCells(cells) {
  const map = new Map();

  for (const c of cells || []) {
    const gridX = Number(c.gridX);
    const gridY = Number(c.gridY);

    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) continue;

    const key = `${gridX}:${gridY}`;
    const existing = map.get(key) || {
      gridX,
      gridY,
      sampleCount: 0,
      totalDwellMs: 0,
      fixationCount: 0,
    };

    existing.sampleCount = Number(c.sampleCount ?? existing.sampleCount ?? 0);
    existing.totalDwellMs = Number(c.totalDwellMs ?? existing.totalDwellMs ?? 0);
    existing.fixationCount = Number(c.fixationCount ?? existing.fixationCount ?? 0);

    map.set(key, existing);
  }

  return Array.from(map.values());
}

export async function upsertHeatmapCellAggregates(sessionId, cells) {
  const normalizedCells = normalizeCells(cells);
  if (!normalizedCells.length) return 0;

  const conn = await getConnection();

  const updateSql = `
    UPDATE HEATMAP_CELL_AGGREGATE
    SET
      SAMPLE_COUNT = :sampleCount,
      TOTAL_DWELL_MS = :totalDwellMs,
      FIXATION_COUNT = :fixationCount,
      LAST_UPDATED = CURRENT_TIMESTAMP
    WHERE SESSION_ID = :sessionId
      AND GRID_X = :gridX
      AND GRID_Y = :gridY
  `;

  const insertSql = `
    INSERT INTO HEATMAP_CELL_AGGREGATE (
      SESSION_ID,
      GRID_X,
      GRID_Y,
      SAMPLE_COUNT,
      TOTAL_DWELL_MS,
      FIXATION_COUNT,
      LAST_UPDATED
    ) VALUES (
      :sessionId,
      :gridX,
      :gridY,
      :sampleCount,
      :totalDwellMs,
      :fixationCount,
      CURRENT_TIMESTAMP
    )
  `;

  let affected = 0;

  try {
    for (const cell of normalizedCells) {
      const binds = {
        sessionId,
        gridX: cell.gridX,
        gridY: cell.gridY,
        sampleCount: cell.sampleCount ?? 0,
        totalDwellMs: cell.totalDwellMs ?? 0,
        fixationCount: cell.fixationCount ?? 0,
      };

      const updateResult = await conn.execute(updateSql, binds, { autoCommit: false });

      if ((updateResult.rowsAffected || 0) > 0) {
        affected += updateResult.rowsAffected || 0;
        continue;
      }

      try {
        const insertResult = await conn.execute(insertSql, binds, { autoCommit: false });
        affected += insertResult.rowsAffected || 0;
      } catch (err) {
        if (err?.errorNum === 1 || err?.code === "ORA-00001") {
          const retryUpdateResult = await conn.execute(updateSql, binds, { autoCommit: false });
          affected += retryUpdateResult.rowsAffected || 0;
        } else {
          throw err;
        }
      }
    }

    await conn.commit();
    return affected;
  } catch (err) {
    await conn.rollback();
    throw err;
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
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows;
  } finally {
    await conn.close();
  }
}