import logger from "../config/logger.js";

function average(values) {
  if (!values?.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function canContinueFixation(currentFixation, sample) {
  if (!currentFixation) return false;

  const timeGap = sample.tsMs - currentFixation.endTsMs;
  if (timeGap > 120) return false;

  const dx = sample.x - average(currentFixation.xs);
  const dy = sample.y - average(currentFixation.ys);
  const distance = Math.hypot(dx, dy);

  return distance <= 80;
}

export function processSampleIntoFixation(session, sample) {
  if (!session.currentFixation) {
    session.currentFixation = {
      sessionId: session.sessionId,
      aoi: sample.aoi ?? "NONE",
      startTsMs: sample.tsMs,
      endTsMs: sample.tsMs,
      xs: [sample.x],
      ys: [sample.y],
      nxs: [sample.nx ?? 0],
      nys: [sample.ny ?? 0],
      gridX: sample.gridX ?? null,
      gridY: sample.gridY ?? null,
      sampleCount: 1,
    };
    return;
  }

  if (canContinueFixation(session.currentFixation, sample)) {
    session.currentFixation.endTsMs = sample.tsMs;
    session.currentFixation.xs.push(sample.x);
    session.currentFixation.ys.push(sample.y);
    session.currentFixation.nxs.push(sample.nx ?? 0);
    session.currentFixation.nys.push(sample.ny ?? 0);
    session.currentFixation.sampleCount += 1;
    return;
  }

  closeCurrentFixation(session);

  session.currentFixation = {
    sessionId: session.sessionId,
    aoi: sample.aoi ?? "NONE",
    startTsMs: sample.tsMs,
    endTsMs: sample.tsMs,
    xs: [sample.x],
    ys: [sample.y],
    nxs: [sample.nx ?? 0],
    nys: [sample.ny ?? 0],
    gridX: sample.gridX ?? null,
    gridY: sample.gridY ?? null,
    sampleCount: 1,
  };
}

export function closeCurrentFixation(session) {
  const fixation = session.currentFixation;
  if (!fixation) return null;

  const durationMs = fixation.endTsMs - fixation.startTsMs;

  if (fixation.sampleCount < 2 || durationMs <= 0) {
    logger.debug(
      {
        sessionId: session.sessionId,
        aoi: fixation.aoi,
        sampleCount: fixation.sampleCount,
        startTsMs: fixation.startTsMs,
        endTsMs: fixation.endTsMs,
        durationMs,
      },
      "dropping invalid fixation"
    );

    session.currentFixation = null;
    return null;
  }

  const fixationRow = {
    sessionId: session.sessionId,
    aoi: fixation.aoi,
    startTsMs: fixation.startTsMs,
    endTsMs: fixation.endTsMs,
    durationMs,
    centerX: Number(average(fixation.xs).toFixed(2)),
    centerY: Number(average(fixation.ys).toFixed(2)),
    centerNx: Number(average(fixation.nxs).toFixed(4)),
    centerNy: Number(average(fixation.nys).toFixed(4)),
    gridX: fixation.gridX,
    gridY: fixation.gridY,
    sampleCount: fixation.sampleCount,
    isVerifiedLook: 0,
    verifyRuleId: null,
  };

  session.totalFixations += 1;
  session.totalGazeDurationMs += durationMs;
  session.fixationInsertBuffer.push(fixationRow);

  const heatmapKey = `${fixationRow.gridX}:${fixationRow.gridY}`;
  const existingHeatmap = session.heatmap.get(heatmapKey) || {
    sessionId: session.sessionId,
    gridX: fixationRow.gridX,
    gridY: fixationRow.gridY,
    sampleCount: 0,
    fixationCount: 0,
    totalDwellMs: 0,
  };

  existingHeatmap.sampleCount += fixation.sampleCount;
  existingHeatmap.fixationCount += 1;
  existingHeatmap.totalDwellMs += durationMs;
  session.heatmap.set(heatmapKey, existingHeatmap);

  const aoiKey = fixationRow.aoi ?? "NONE";
  const existingAoi = session.aoiAggregates.get(aoiKey) || {
    sessionId: session.sessionId,
    aoi: aoiKey,
    sampleCount: 0,
    fixationCount: 0,
    totalDwellMs: 0,
    avgFixationMs: 0,
    longestFixationMs: 0,
    firstLookTsMs: null,
    lastLookTsMs: null,
    lookVerifiedCount: 0,
  };

  existingAoi.sampleCount += fixation.sampleCount;
  existingAoi.fixationCount += 1;
  existingAoi.totalDwellMs += durationMs;
  existingAoi.avgFixationMs =
    existingAoi.fixationCount > 0
      ? Number((existingAoi.totalDwellMs / existingAoi.fixationCount).toFixed(2))
      : 0;
  existingAoi.longestFixationMs = Math.max(existingAoi.longestFixationMs, durationMs);
  existingAoi.firstLookTsMs =
    existingAoi.firstLookTsMs == null
      ? fixationRow.startTsMs
      : Math.min(existingAoi.firstLookTsMs, fixationRow.startTsMs);
  existingAoi.lastLookTsMs =
    existingAoi.lastLookTsMs == null
      ? fixationRow.endTsMs
      : Math.max(existingAoi.lastLookTsMs, fixationRow.endTsMs);

  session.aoiAggregates.set(aoiKey, existingAoi);

  session.currentFixation = null;
  return fixationRow;
}