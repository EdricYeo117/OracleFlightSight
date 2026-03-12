import logger from "../config/logger.js";
import {
  getFlightSessions,
  getFlightSessionById,
} from "../db/flightSessionModel.js";
import { getHeatmapCellsBySession } from "../db/heatmapAggregateModel.js";
import { getAoiAggregatesBySession } from "../db/aoiAggregateModel.js";
import { getAoiRuleResultsBySession } from "../db/aoiRuleResultModel.js";
import { getGazeFixationsBySession } from "../db/gazeFixationModel.js";
import { getAoiVisitsBySession } from "../db/aoiVisitModel.js";

function buildObjectAttention(aoiAggregates = [], ruleResults = []) {
  const ruleMap = new Map(ruleResults.map((r) => [r.AOI, r]));

  return aoiAggregates.map((aoi) => {
    const rule = ruleMap.get(aoi.AOI);

    return {
      aoi: aoi.AOI,
      totalDwellMs: aoi.TOTAL_DWELL_MS ?? 0,
      totalDwellSec: Number(((aoi.TOTAL_DWELL_MS ?? 0) / 1000).toFixed(2)),
      fixationCount: aoi.FIXATION_COUNT ?? 0,
      avgFixationMs: aoi.AVG_FIXATION_MS ?? 0,
      longestFixationMs: aoi.LONGEST_FIXATION_MS ?? 0,
      visitCount: aoi.VISIT_COUNT ?? 0,
      avgVisitMs: aoi.AVG_VISIT_MS ?? 0,
      longestVisitMs: aoi.LONGEST_VISIT_MS ?? 0,
      firstLookTsMs: aoi.FIRST_LOOK_TS_MS,
      lastLookTsMs: aoi.LAST_LOOK_TS_MS,
      lookVerifiedCount: aoi.LOOK_VERIFIED_COUNT ?? 0,
      passed: rule ? Number(rule.PASSED) === 1 : null,
    };
  });
}

function buildVisitTimeline(visits = []) {
  const byAoi = new Map();

  for (const visit of visits) {
    const aoi = visit.AOI ?? "NONE";
    if (!byAoi.has(aoi)) byAoi.set(aoi, []);
    byAoi.get(aoi).push({
      visitId: visit.VISIT_ID,
      startTsMs: visit.START_TS_MS,
      endTsMs: visit.END_TS_MS,
      durationMs: visit.DURATION_MS,
      fixationCount: visit.FIXATION_COUNT,
      visitOrderNo: visit.VISIT_ORDER_NO,
    });
  }

  return Array.from(byAoi.entries()).map(([aoi, aoiVisits]) => ({
    aoi,
    visits: aoiVisits.sort((a, b) => a.startTsMs - b.startTsMs),
  }));
}

export async function listAnalyticsSessions() {
  logger.debug("listAnalyticsSessions start");
  const rows = await getFlightSessions();
  logger.debug({ sessionCount: rows.length }, "listAnalyticsSessions complete");
  return rows;
}

export async function getSessionDashboard(sessionId) {
  logger.debug({ sessionId }, "getSessionDashboard start");

  const [session, heatmapCells, aoiAggregates, ruleResults, fixations, visits] =
    await Promise.all([
      getFlightSessionById(sessionId),
      getHeatmapCellsBySession(sessionId),
      getAoiAggregatesBySession(sessionId),
      getAoiRuleResultsBySession(sessionId),
      getGazeFixationsBySession(sessionId),
      getAoiVisitsBySession(sessionId),
    ]);

  if (!session) {
    logger.warn({ sessionId }, "getSessionDashboard session not found");
    return null;
  }

  const objectAttention = buildObjectAttention(aoiAggregates, ruleResults);
  const visitTimeline = buildVisitTimeline(visits);

  const dashboard = {
    summary: {
      sessionId: session.SESSION_ID,
      scenarioId: session.SCENARIO_ID,
      pilotId: session.PILOT_ID,
      sessionStatus: session.SESSION_STATUS,
      startedAt: session.STARTED_AT,
      endedAt: session.ENDED_AT,
      screenWidth: session.SCREEN_WIDTH,
      screenHeight: session.SCREEN_HEIGHT,
      gridCols: session.GRID_COLS,
      gridRows: session.GRID_ROWS,
      totalSamples: session.TOTAL_SAMPLES,
      totalFixations: session.TOTAL_FIXATIONS,
      totalGazeDurationMs: session.TOTAL_GAZE_DURATION_MS,
      notes: session.NOTES,
    },
    heatmapCells,
    aoiAggregates,
    ruleResults,
    fixations,
    visits,
    objectAttention,
    visitTimeline,
  };

  logger.debug(
    {
      sessionId,
      heatmapCellCount: heatmapCells.length,
      aoiAggregateCount: aoiAggregates.length,
      ruleResultCount: ruleResults.length,
      fixationCount: fixations.length,
      visitCount: visits.length,
      objectAttentionCount: objectAttention.length,
      visitTimelineCount: visitTimeline.length,
    },
    "getSessionDashboard complete",
  );

  return dashboard;
}
