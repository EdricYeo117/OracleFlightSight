import { getConnection } from "../config/db.js";
import oracledb from "oracledb";
import logger from "../config/logger.js";

export async function insertGazeSamples(samples) {
  if (!samples?.length) {
    logger.debug("insertGazeSamples skipped: no samples provided");
    return 0;
  }

  const sessionId = samples[0]?.sessionId ?? null;

  logger.debug(
    {
      sessionId,
      sampleCount: samples.length,
      firstTsMs: samples[0]?.tsMs ?? null,
      lastTsMs: samples[samples.length - 1]?.tsMs ?? null,
    },
    "insertGazeSamples start",
  );

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

    const binds = samples.map((s, index) => ({
      sessionId: s.sessionId,
      tsMs: s.tsMs,
      elapsedMs: s.elapsedMs ?? null,
      x: s.x,
      y: s.y,
      nx: s.nx ?? null,
      ny: s.ny ?? null,
      aoi: s.aoi ?? null,
      confidence: s.confidence ?? null,
      gridX: s.gridX ?? s.grid?.x ?? null,
      gridY: s.gridY ?? s.grid?.y ?? null,
      isValid: s.isValid ?? 1,
      invalidReason: s.invalidReason ?? null,
      __index: index,
    }));

    const invalidSamples = binds.filter(
      (s) =>
        !s.sessionId ||
        typeof s.tsMs !== "number" ||
        typeof s.x !== "number" ||
        typeof s.y !== "number",
    );

    if (invalidSamples.length) {
      logger.warn(
        {
          sessionId,
          invalidCount: invalidSamples.length,
          invalidIndexes: invalidSamples.map((s) => s.__index),
        },
        "insertGazeSamples found malformed samples before insert",
      );
    }

    const sanitizedBinds = binds.map(({ __index, ...rest }) => rest);

    const result = await conn.executeMany(sql, sanitizedBinds, {
      autoCommit: true,
    });

    logger.info(
      {
        sessionId,
        sampleCount: samples.length,
        rowsAffected: result.rowsAffected || 0,
      },
      "insertGazeSamples complete",
    );

    return result.rowsAffected || 0;
  } catch (err) {
    logger.error(
      {
        err,
        sessionId,
        sampleCount: samples.length,
        firstSample: samples[0]
          ? {
              tsMs: samples[0].tsMs,
              x: samples[0].x,
              y: samples[0].y,
              aoi: samples[0].aoi,
              gridX: samples[0].gridX ?? samples[0].grid?.x ?? null,
              gridY: samples[0].gridY ?? samples[0].grid?.y ?? null,
            }
          : null,
        lastSample: samples[samples.length - 1]
          ? {
              tsMs: samples[samples.length - 1].tsMs,
              x: samples[samples.length - 1].x,
              y: samples[samples.length - 1].y,
              aoi: samples[samples.length - 1].aoi,
              gridX:
                samples[samples.length - 1].gridX ??
                samples[samples.length - 1].grid?.x ??
                null,
              gridY:
                samples[samples.length - 1].gridY ??
                samples[samples.length - 1].grid?.y ??
                null,
            }
          : null,
      },
      "insertGazeSamples failed",
    );
    throw err;
  } finally {
    try {
      await conn.close();
      logger.debug({ sessionId }, "insertGazeSamples connection closed");
    } catch (closeErr) {
      logger.error(
        { err: closeErr, sessionId },
        "insertGazeSamples failed to close connection",
      );
    }
  }
}
