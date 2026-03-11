import { liveSessions } from "../state/liveSessionState.js";
import { insertFlightSession } from "../db/flightSessionModel.js";

export async function createSession({
  scenarioId = "demo-flight-sim",
  pilotId = "local-user",
  screenWidth = 0,
  screenHeight = 0,
  gridCols = 40,
  gridRows = 24,
  notes = null,
}) {
  const sessionId = `fs_${Date.now()}`;

  await insertFlightSession({
    sessionId,
    scenarioId,
    pilotId,
    sessionStatus: "ACTIVE",
    screenWidth,
    screenHeight,
    gridCols,
    gridRows,
    notes,
  });

const session = {
  sessionId,
  scenarioId,
  pilotId,
  screenWidth,
  screenHeight,
  gridCols,
  gridRows,
  startedAt: new Date().toISOString(),
  heatmap: new Map(),
  aoiCounts: {},
  bufferedSamples: [],
  fixationInsertBuffer: [],
  aoiAggregates: new Map(),
  ruleProgress: {},
  rules: [],
  currentFixation: null,
  totalSamples: 0,
  totalFixations: 0,
  totalGazeDurationMs: 0,
  lastUpdated: Date.now(),
};

  liveSessions.set(sessionId, session);

  return {
    sessionId,
    scenarioId,
    pilotId,
    screenWidth,
    screenHeight,
    gridCols,
    gridRows,
    startedAt: session.startedAt,
    status: "ACTIVE",
  };
}