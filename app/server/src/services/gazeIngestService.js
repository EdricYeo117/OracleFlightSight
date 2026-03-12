/**
 * Module: app/server/src/services/gazeIngestService.js
 * Layer: Backend
 * Purpose:
 * - Implements the gazeIngestService unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import logger from "../config/logger.js";
import { liveSessions } from "../state/liveSessionState.js";

import { insertGazeSamples } from "../db/gazeSampleModel.js";
import { insertGazeFixations } from "../db/gazeFixationModel.js";
import { upsertHeatmapCellAggregates } from "../db/heatmapAggregateModel.js";
import { upsertAoiAggregates } from "../db/aoiAggregateModel.js";
import { updateFlightSessionTotals } from "../db/flightSessionModel.js";

import {
  processSampleIntoFixation,
  closeCurrentFixation,
} from "./aggregateService.js";

export async function ingestBatch({ sessionId, samples }) {
  logger.debug({ sessionId, sampleCount: samples.length }, "ingestBatch start");

  const session = liveSessions.get(sessionId);
  if (!session) {
    logger.error({ sessionId }, "session not found during ingest");
    throw new Error(`Session not found: ${sessionId}`);
  }

  const normalizedSamples = samples.map((sample) => ({
    ...sample,
    gridX: sample.gridX ?? sample.grid?.x ?? null,
    gridY: sample.gridY ?? sample.grid?.y ?? null,
  }));

  logger.debug({ sessionId }, "inserting gaze samples");
  await insertGazeSamples(normalizedSamples);

  for (const sample of normalizedSamples) {
    const aoi = sample.aoi || "NONE";
    session.aoiCounts[aoi] = (session.aoiCounts[aoi] || 0) + 1;
    session.bufferedSamples.push(sample);
    session.totalSamples += 1;

    processSampleIntoFixation(session, sample);
  }

  logger.debug(
    {
      sessionId,
      fixationBufferSize: session.fixationInsertBuffer.length,
    },
    "post-fixation processing"
  );

  if (session.fixationInsertBuffer.length) {
    logger.debug({ sessionId }, "inserting gaze fixations");
    await insertGazeFixations(session.fixationInsertBuffer);
    session.fixationInsertBuffer = [];
  }

  logger.debug({ sessionId }, "upserting heatmap aggregates");
  await upsertHeatmapCellAggregates(
    sessionId,
    Array.from(session.heatmap.values())
  );

  logger.debug({ sessionId }, "upserting aoi aggregates");
  await upsertAoiAggregates(
    sessionId,
    Array.from(session.aoiAggregates.values())
  );

  logger.debug({ sessionId }, "updating flight session totals");
  await updateFlightSessionTotals({
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  });

  logger.info(
    {
      sessionId,
      totalSamples: session.totalSamples,
      totalFixations: session.totalFixations,
      totalGazeDurationMs: session.totalGazeDurationMs,
    },
    "ingestBatch complete"
  );

  return {
    sessionId,
    ingested: normalizedSamples.length,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
    heatmapCells: Array.from(session.heatmap.values()),
    aoiCounts: session.aoiCounts,
    ruleProgress: session.ruleProgress,
  };
}

export async function finalizeIngestionSession(sessionId) {
  logger.info({ sessionId }, "finalizeIngestionSession start");

  const session = liveSessions.get(sessionId);
  if (!session) {
    logger.error({ sessionId }, "session not found during finalize");
    throw new Error(`Session not found: ${sessionId}`);
  }

  const finalFixation = closeCurrentFixation(session);

  if (finalFixation && session.fixationInsertBuffer.length) {
    logger.debug({ sessionId }, "inserting final fixation buffer");
    await insertGazeFixations(session.fixationInsertBuffer);
    session.fixationInsertBuffer = [];
  }

  logger.debug({ sessionId }, "final heatmap aggregate upsert");
  await upsertHeatmapCellAggregates(
    sessionId,
    Array.from(session.heatmap.values())
  );

  logger.debug({ sessionId }, "final aoi aggregate upsert");
  await upsertAoiAggregates(
    sessionId,
    Array.from(session.aoiAggregates.values())
  );

  logger.debug({ sessionId }, "final session totals update");
  await updateFlightSessionTotals({
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  });

  logger.info(
    {
      sessionId,
      totalSamples: session.totalSamples,
      totalFixations: session.totalFixations,
      totalGazeDurationMs: session.totalGazeDurationMs,
    },
    "finalizeIngestionSession complete"
  );

  return {
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  };
}