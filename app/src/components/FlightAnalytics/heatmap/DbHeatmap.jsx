import React from "react";
import HeatMap from "react-heatmap-grid";

export default function DbHeatmap({ matrix, gridCols, gridRows }) {
  const xLabels = Array.from({ length: gridCols }, (_, i) => String(i));
  const yLabels = Array.from({ length: gridRows }, (_, i) => String(i));

  const safeMatrix =
    Array.isArray(matrix) && matrix.length
      ? matrix
      : Array.from({ length: gridRows }, () =>
          Array.from({ length: gridCols }, () => 0),
        );

  const maxValue = Math.max(1, ...safeMatrix.flat());

  return (
    <div className="panel">
      <h3>Heatmap</h3>
      <div style={{ overflow: "auto" }}>
        <HeatMap
          xLabels={xLabels}
          yLabels={yLabels}
          data={safeMatrix}
          squares
          cellStyle={(_background, value, min, max) => {
            const intensity = maxValue ? value / maxValue : 0;
            const alpha = Math.max(0.08, intensity);
            return {
              background: `rgba(255, 99, 132, ${alpha})`,
              fontSize: "10px",
              color: value > maxValue * 0.45 ? "#fff" : "#111",
              border: "1px solid rgba(255,255,255,0.08)",
            };
          }}
          cellRender={(value) => (value > 0 ? value : "")}
          xLabelsStyle={() => ({
            fontSize: "10px",
            color: "#cbd5e1",
          })}
          yLabelsStyle={() => ({
            fontSize: "10px",
            color: "#cbd5e1",
          })}
        />
      </div>
    </div>
  );
}
