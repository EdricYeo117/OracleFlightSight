import logger from "../config/logger.js";
import { liveSessions } from "../state/liveSessionState.js";

import { insertGazeSamples } from "../db/gazeSampleModel.js";
import { insertGazeFixations } from "../db/gazeFixationModel.js";
import { insertAoiVisits } from "../db/aoiVisitModel.js";
import { upsertHeatmapCellAggregates } from "../db/heatmapAggregateModel.js";
import { upsertAoiAggregates } from "../db/aoiAggregateModel.js";
import { updateFlightSessionTotals } from "../db/flightSessionModel.js";

import {
  processSampleIntoFixation,
  closeAllAttentionState,
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

  await insertGazeSamples(normalizedSamples);

  for (const sample of normalizedSamples) {
    const aoi = sample.aoi || "NONE";
    session.aoiCounts[aoi] = (session.aoiCounts[aoi] || 0) + 1;
    session.bufferedSamples.push(sample);
    session.totalSamples += 1;

    processSampleIntoFixation(session, sample);
  }

  if (session.fixationInsertBuffer.length) {
    await insertGazeFixations(session.fixationInsertBuffer);
    session.fixationInsertBuffer = [];
  }

  if (session.visitInsertBuffer.length) {
    await insertAoiVisits(session.visitInsertBuffer);
    session.visitInsertBuffer = [];
  }

  await upsertHeatmapCellAggregates(
    sessionId,
    Array.from(session.heatmap.values()),
  );

  await upsertAoiAggregates(
    sessionId,
    Array.from(session.aoiAggregates.values()),
  );

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
    "ingestBatch complete",
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

  closeAllAttentionState(session);

  if (session.fixationInsertBuffer.length) {
    await insertGazeFixations(session.fixationInsertBuffer);
    session.fixationInsertBuffer = [];
  }

  if (session.visitInsertBuffer.length) {
    await insertAoiVisits(session.visitInsertBuffer);
    session.visitInsertBuffer = [];
  }

  await upsertHeatmapCellAggregates(
    sessionId,
    Array.from(session.heatmap.values()),
  );

  await upsertAoiAggregates(
    sessionId,
    Array.from(session.aoiAggregates.values()),
  );

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
    "finalizeIngestionSession complete",
  );

  return {
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  };
}
