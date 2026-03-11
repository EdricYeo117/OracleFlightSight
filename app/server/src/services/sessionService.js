import { liveSessions } from "../state/liveSessionState.js";

export function createSession({
  scenarioId = "demo-flight-sim",
  pilotId = "local-user",
  screenWidth = 0,
  screenHeight = 0
}) {
  const sessionId = `fs_${Date.now()}`;

  const session = {
    sessionId,
    scenarioId,
    pilotId,
    screenWidth,
    screenHeight,
    startedAt: new Date().toISOString(),
    heatmap: new Map(),
    aoiCounts: {},
    bufferedSamples: [],
    lastUpdated: Date.now()
  };

  liveSessions.set(sessionId, session);

  return {
    sessionId,
    scenarioId,
    pilotId,
    screenWidth,
    screenHeight,
    startedAt: session.startedAt,
    status: "started"
  };
}