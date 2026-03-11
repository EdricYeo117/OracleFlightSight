function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function shouldContinueFixation(currentFixation, sample) {
  if (!currentFixation) return false;
  if (currentFixation.aoi !== sample.aoi) return false;

  const timeGap = sample.tsMs - currentFixation.endTsMs;
  if (timeGap > 120) return false;

  const dx = sample.x - average(currentFixation.xs);
  const dy = sample.y - average(currentFixation.ys);
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance <= 80;
}

export function processSampleIntoFixation(session, sample) {
  const current = session.currentFixation;

  if (!current || !shouldContinueFixation(current, sample)) {
    const closedFixation = closeCurrentFixation(session);

    session.currentFixation = {
      aoi: sample.aoi,
      startTsMs: sample.tsMs,
      endTsMs: sample.tsMs,
      sampleCount: 1,
      xs: [sample.x],
      ys: [sample.y],
      nxs: [sample.nx],
      nys: [sample.ny],
      gridX: sample.gridX,
      gridY: sample.gridY
    };

    return closedFixation;
  }

  current.endTsMs = sample.tsMs;
  current.sampleCount += 1;
  current.xs.push(sample.x);
  current.ys.push(sample.y);
  current.nxs.push(sample.nx);
  current.nys.push(sample.ny);

  return null;
}

export function closeCurrentFixation(session) {
  const fixation = session.currentFixation;
  if (!fixation) return null;

  const durationMs = fixation.endTsMs - fixation.startTsMs;

  // Skip invalid / too-short fixations
  if (fixation.sampleCount < 2 || durationMs <= 0) {
    session.currentFixation = null;
    return null;
  }

  const centerX = average(fixation.xs);
  const centerY = average(fixation.ys);
  const centerNx = average(fixation.nxs);
  const centerNy = average(fixation.nys);

  const fixationRow = {
    sessionId: session.sessionId,
    aoi: fixation.aoi,
    startTsMs: fixation.startTsMs,
    endTsMs: fixation.endTsMs,
    durationMs,
    centerX,
    centerY,
    centerNx,
    centerNy,
    gridX: fixation.gridX,
    gridY: fixation.gridY,
    sampleCount: fixation.sampleCount,
    isVerifiedLook: 0,
    verifyRuleId: null,
  };

  session.totalFixations += 1;
  session.totalGazeDurationMs += durationMs;
  session.fixationInsertBuffer.push(fixationRow);

  updateAoiAggregate(session, fixationRow);
  updateHeatmapAggregate(session, fixationRow);
  evaluateRules(session, fixationRow);

  session.currentFixation = null;
  return fixationRow;
}

export function updateAoiAggregate(session, fixation) {
  const key = fixation.aoi || "NONE";

  const agg = session.aoiAggregates.get(key) || {
    aoi: key,
    sampleCount: 0,
    fixationCount: 0,
    totalDwellMs: 0,
    avgFixationMs: 0,
    longestFixationMs: 0,
    firstLookTsMs: null,
    lastLookTsMs: null,
    lookVerifiedCount: 0
  };

  agg.fixationCount += 1;
  agg.sampleCount += fixation.sampleCount;
  agg.totalDwellMs += fixation.durationMs;
  agg.longestFixationMs = Math.max(agg.longestFixationMs, fixation.durationMs);
  agg.avgFixationMs = agg.totalDwellMs / agg.fixationCount;
  agg.firstLookTsMs = agg.firstLookTsMs ?? fixation.startTsMs;
  agg.lastLookTsMs = fixation.endTsMs;

  session.aoiAggregates.set(key, agg);
}

export function updateHeatmapAggregate(session, fixation) {
  const key = `${fixation.gridX}:${fixation.gridY}`;

  const cell = session.heatmap.get(key) || {
    gridX: fixation.gridX,
    gridY: fixation.gridY,
    sampleCount: 0,
    totalDwellMs: 0,
    fixationCount: 0
  };

  cell.sampleCount += fixation.sampleCount;
  cell.totalDwellMs += fixation.durationMs;
  cell.fixationCount += 1;

  session.heatmap.set(key, cell);
}

export function evaluateRules(session, fixation) {
  for (const rule of session.rules) {
    if (rule.aoi !== fixation.aoi) continue;

    const passedDwell =
      rule.minDwellMs == null || fixation.durationMs >= rule.minDwellMs;

    const progress = session.ruleProgress[rule.ruleId] || {
      actualDwellMs: 0,
      actualFixationCount: 0,
      passed: false,
      firstSatisfiedTsMs: null
    };

    progress.actualDwellMs += fixation.durationMs;
    progress.actualFixationCount += 1;

    const passedFixationCount =
      rule.minFixationCount == null ||
      progress.actualFixationCount >= rule.minFixationCount;

    if (!progress.passed && passedDwell && passedFixationCount) {
      progress.passed = true;
      progress.firstSatisfiedTsMs = fixation.endTsMs;
      fixation.isVerifiedLook = 1;
      fixation.verifyRuleId = rule.ruleId;

      const agg = session.aoiAggregates.get(fixation.aoi);
      if (agg) {
        agg.lookVerifiedCount += 1;
      }
    }

    session.ruleProgress[rule.ruleId] = progress;
  }
}