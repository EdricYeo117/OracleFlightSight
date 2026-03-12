/**
 * Module: app/src/components/FlightAnalytics/BatchDebugPanel.jsx
 * Layer: Frontend
 * Purpose:
 * - Implements the BatchDebugPanel unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import React from "react";

export default function BatchDebugPanel({
  isTracking,
  currentAOI,
  sampleBufferCount,
  lastBatch,
  aoiCounts,
}) {
  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 16,
        width: 360,
        maxHeight: 320,
        overflow: "auto",
        zIndex: 60,
        background: "rgba(7,10,18,0.9)",
        border: "1px solid rgba(74,170,255,0.3)",
        borderRadius: 12,
        padding: 12,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8, color: "#4af" }}>
        Gaze Debug
      </div>

      <div>Status: {isTracking ? "TRACKING" : "IDLE"}</div>
      <div>Current AOI: {currentAOI || "NONE"}</div>
      <div>Buffered samples: {sampleBufferCount}</div>

      <div style={{ marginTop: 10, marginBottom: 6, color: "#4af" }}>AOI hits</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(aoiCounts, null, 2)}
      </pre>

      <div style={{ marginTop: 10, marginBottom: 6, color: "#4af" }}>
        Last batch payload
      </div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {lastBatch ? JSON.stringify(lastBatch, null, 2) : "No batch flushed yet"}
      </pre>
    </div>
  );
}