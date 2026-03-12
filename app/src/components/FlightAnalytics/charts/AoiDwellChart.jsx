import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AoiDwellChart({ data }) {
  const safeData = (data || []).slice().sort((a, b) => (b.y ?? 0) - (a.y ?? 0));

  const chartData = {
    labels: safeData.map((d) => d.x),
    datasets: [
      {
        label: "Dwell Time (ms)",
        data: safeData.map((d) => d.y),
        backgroundColor: [
          "rgba(200,164,77,0.95)",
          "rgba(127,214,255,0.9)",
          "rgba(124,255,178,0.88)",
          "rgba(255,184,77,0.88)",
          "rgba(95,144,255,0.85)",
        ],
        borderColor: ["#f2e3b0", "#7fd6ff", "#7cffb2", "#ffb84d", "#6aa8ff"],
        borderWidth: 1.5,
        borderRadius: 12,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#d8e4f0",
          font: { family: "Inter, sans-serif", size: 12 },
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(6,23,43,0.96)",
        borderColor: "rgba(200,164,77,0.45)",
        borderWidth: 1,
        titleColor: "#f2e3b0",
        bodyColor: "#eef4fb",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#cbd5e1",
          font: { family: "Inter, sans-serif", size: 11 },
        },
        grid: { color: "rgba(255,255,255,0.06)" },
      },
      y: {
        ticks: {
          color: "#cbd5e1",
          font: { family: "Inter, sans-serif", size: 11 },
        },
        grid: { color: "rgba(255,255,255,0.08)" },
      },
    },
  };

  return (
    <div className="panel panel-tall">
      <div className="panel-header">
        <div>
          <h3>Object Dwell Time</h3>
          <p>Total cumulative attention duration by cockpit object</p>
        </div>
      </div>
      <div className="chart-wrap">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
