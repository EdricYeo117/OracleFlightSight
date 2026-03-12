/**
 * Module: app/src/components/FlightAnalytics/HeatmapOverlay.jsx
 * Layer: Frontend
 * Purpose:
 * - Implements the HeatmapOverlay unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import React from "react";

export default function HeatmapOverlay({
  cells,
  bounds,
  cols = 40,
  rows = 24,
  visible = true,
}) {
  if (!visible || !bounds || !cells?.length) return null;

  const cellWidth = bounds.width / cols;
  const cellHeight = bounds.height / rows;
  const maxValue = Math.max(...cells.map((c) => c.value), 1);

  const getHeatColor = (intensity) => {
    if (intensity > 0.85) return `rgba(255, 0, 0, ${0.75})`;
    if (intensity > 0.65) return `rgba(255, 120, 0, ${0.6})`;
    if (intensity > 0.45) return `rgba(255, 220, 0, ${0.5})`;
    if (intensity > 0.25) return `rgba(80, 255, 80, ${0.35})`;
    return `rgba(0, 180, 255, ${0.25})`;
  };

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 15 }}>
      {cells.map((cell) => {
        const intensity = cell.value / maxValue;
        return (
          <div
            key={`${cell.gx}-${cell.gy}`}
            style={{
              position: "absolute",
              left: cell.gx * cellWidth,
              top: cell.gy * cellHeight,
              width: cellWidth,
              height: cellHeight,
              background: getHeatColor(intensity),
              filter: "blur(6px)",
            }}
          />
        );
      })}
    </div>
  );
}