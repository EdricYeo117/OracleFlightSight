import { liveSessions } from "../state/liveSessionState.js";

export function ingestBatch({ sessionId, samples }) {
  const session = liveSessions.get(sessionId);

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  for (const sample of samples) {
    const gx = sample?.grid?.x;
    const gy = sample?.grid?.y;
    const aoi = sample?.aoi || "NONE";

    if (typeof gx === "number" && typeof gy === "number") {
      const key = `${gx}:${gy}`;
      const current = session.heatmap.get(key) || { gx, gy, value: 0 };
      current.value += 1;
      session.heatmap.set(key, current);
    }

    session.aoiCounts[aoi] = (session.aoiCounts[aoi] || 0) + 1;
    session.bufferedSamples.push(sample);
  }

  session.lastUpdated = Date.now();

  return {
    sessionId,
    ingested: samples.length,
    heatmapCells: Array.from(session.heatmap.values()),
    aoiCounts: session.aoiCounts
  };
}