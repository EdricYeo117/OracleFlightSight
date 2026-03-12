/**
 * Module: app/src/components/FlightAnalytics/GazeDot.jsx
 * Layer: Frontend
 * Purpose:
 * - Implements the GazeDot unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import React from "react";

export default function GazeDot({ point }) {
  if (!point) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: point.x - 8,
        top: point.y - 8,
        width: 16,
        height: 16,
        borderRadius: "50%",
        background: "rgba(0,255,255,0.85)",
        border: "2px solid rgba(255,255,255,0.95)",
        boxShadow: "0 0 18px rgba(0,255,255,0.9)",
        pointerEvents: "none",
        zIndex: 35,
      }}
    />
  );
}