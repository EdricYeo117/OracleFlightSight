import React from "react";

function formatMs(ms = 0) {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function SessionKpiCards({
  summary,
  objectAttention = [],
  visits = [],
}) {
  const focusedObjects = objectAttention.length;
  const visitCount = visits.length;
  const cards = [
    { label: "Total Samples", value: summary.totalSamples },
    { label: "Total Fixations", value: summary.totalFixations },
    { label: "Total Dwell", value: formatMs(summary.totalGazeDurationMs || 0) },
    { label: "Objects Viewed", value: focusedObjects },
    { label: "Visits", value: visitCount },
    { label: "Scenario", value: summary.scenarioId || "-" },
  ];

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <div className="panel kpi-card" key={card.label}>
          <div className="kpi-label">{card.label}</div>
          <div className="kpi-value">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
