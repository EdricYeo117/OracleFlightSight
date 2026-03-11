import { liveSessions } from "../state/liveSessionState.js";
import { insertGazeSamples } from "../db/gazeSampleModel.js";
import { insertGazeFixations } from "../db/gazeFixationModel.js";
import { upsertHeatmapCellAggregates } from "../db/heatmapAggregateModel.js";
import { upsertAoiAggregates } from "../db/aoiAggregateModel.js";
import { upsertAoiRuleResults } from "../db/aoiRuleResultModel.js";
import { updateFlightSessionTotals } from "../db/flightSessionModel.js";
import {
  processSampleIntoFixation,
  closeCurrentFixation,
} from "./aggregateService.js";

export async function ingestBatch({ sessionId, samples }) {
  const session = liveSessions.get(sessionId);
  if (!session) {
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

  await upsertHeatmapCellAggregates(
    sessionId,
    Array.from(session.heatmap.values())
  );

  await upsertAoiAggregates(
    sessionId,
    Array.from(session.aoiAggregates.values())
  );

  await upsertAoiRuleResults(
    sessionId,
    Object.entries(session.ruleProgress).map(([ruleId, progress]) => ({
      ruleId,
      aoi: session.rules.find((r) => String(r.RULE_ID ?? r.ruleId) === String(ruleId))?.AOI
        ?? session.rules.find((r) => String(r.ruleId) === String(ruleId))?.aoi
        ?? null,
      passed: progress.passed,
      actualDwellMs: progress.actualDwellMs,
      actualFixationCount: progress.actualFixationCount,
      firstSatisfiedTsMs: progress.firstSatisfiedTsMs,
    }))
  );

  await updateFlightSessionTotals({
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  });

  session.lastUpdated = Date.now();

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
  const session = liveSessions.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const finalFixation = closeCurrentFixation(session);
  if (finalFixation && session.fixationInsertBuffer.length) {
    await insertGazeFixations(session.fixationInsertBuffer);
    session.fixationInsertBuffer = [];
  }

  await upsertHeatmapCellAggregates(sessionId, Array.from(session.heatmap.values()));
  await upsertAoiAggregates(sessionId, Array.from(session.aoiAggregates.values()));
  await upsertAoiRuleResults(
    sessionId,
    Object.entries(session.ruleProgress).map(([ruleId, progress]) => ({
      ruleId,
      aoi: null,
      passed: progress.passed,
      actualDwellMs: progress.actualDwellMs,
      actualFixationCount: progress.actualFixationCount,
      firstSatisfiedTsMs: progress.firstSatisfiedTsMs,
    }))
  );

  await updateFlightSessionTotals({
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  });

  return {
    sessionId,
    totalSamples: session.totalSamples,
    totalFixations: session.totalFixations,
    totalGazeDurationMs: session.totalGazeDurationMs,
  };
}