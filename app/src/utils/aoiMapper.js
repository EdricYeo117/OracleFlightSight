/**
 * Module: app/src/utils/aoiMapper.js
 * Layer: Frontend
 * Purpose:
 * - Implements the aoiMapper unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

export const DEFAULT_AOIS = [
  {
    id: "LEFT_PANEL",
    label: "Left Panel",
    xPct: 0.0,
    yPct: 0.10,
    wPct: 0.19,
    hPct: 0.72,
    color: "rgba(74,170,255,0.22)",
  },
  {
    id: "OUTSIDE_VIEW",
    label: "Outside View",
    xPct: 0.18,
    yPct: 0.08,
    wPct: 0.64,
    hPct: 0.62,
    color: "rgba(0,255,150,0.18)",
  },
  {
    id: "HUD_CENTER",
    label: "HUD Center",
    xPct: 0.38,
    yPct: 0.24,
    wPct: 0.24,
    hPct: 0.22,
    color: "rgba(255,255,0,0.18)",
  },
  {
    id: "RIGHT_PANEL",
    label: "Right Panel",
    xPct: 0.81,
    yPct: 0.10,
    wPct: 0.19,
    hPct: 0.72,
    color: "rgba(255,140,0,0.18)",
  },
  {
    id: "BOTTOM_GAUGES",
    label: "Bottom Gauges",
    xPct: 0.16,
    yPct: 0.78,
    wPct: 0.68,
    hPct: 0.18,
    color: "rgba(120,255,120,0.18)",
  },
  {
    id: "TOP_BAR",
    label: "Top Bar",
    xPct: 0.0,
    yPct: 0.0,
    wPct: 1.0,
    hPct: 0.08,
    color: "rgba(255,255,255,0.10)",
  },
];

export function resolveAOIRects(aois, bounds) {
  return aois.map((aoi) => ({
    ...aoi,
    x: aoi.xPct * bounds.width,
    y: aoi.yPct * bounds.height,
    width: aoi.wPct * bounds.width,
    height: aoi.hPct * bounds.height,
  }));
}

export function mapPointToAOI(x, y, resolvedAOIs) {
  const match = resolvedAOIs.find(
    (aoi) =>
      x >= aoi.x &&
      x <= aoi.x + aoi.width &&
      y >= aoi.y &&
      y <= aoi.y + aoi.height
  );

  return match ? match.id : "NONE";
}