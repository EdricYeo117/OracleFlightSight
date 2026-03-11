import React from "react";

export default function AnalyticsPanel({ stats }) {
  if (!stats) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        zIndex: 80,
        width: 360,
        background: "rgba(10,12,18,0.92)",
        border: "1px solid rgba(74,170,255,0.3)",
        borderRadius: 12,
        padding: 12,
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 12
      }}
    >
      <div style={{ color: "#4af", fontWeight: 700, marginBottom: 8 }}>
        Pilot Analytics
      </div>

      <div>Total Samples: {stats.totalSamples ?? 0}</div>
      <div>Total Fixations: {stats.totalFixations ?? 0}</div>
      <div>Total Gaze Duration: {stats.totalGazeDurationMs ?? 0} ms</div>

      <div style={{ marginTop: 8, color: "#4af" }}>Top AOIs</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(stats.topAOIs ?? [], null, 2)}
      </pre>

      <div style={{ marginTop: 8, color: "#4af" }}>Rule Results</div>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
        {JSON.stringify(stats.ruleResults ?? [], null, 2)}
      </pre>
    </div>
  );
}