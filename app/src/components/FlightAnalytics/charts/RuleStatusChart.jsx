import React from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function RuleStatusChart({ data }) {
  const chartData = {
    labels: data.map((d) => d.x),
    datasets: [
      {
        label: "Rule Status",
        data: data.map((d) => d.y),
        backgroundColor: ["rgba(124,255,178,0.92)", "rgba(255,107,122,0.88)"],
        borderColor: ["#7cffb2", "#ff6b7a"],
        borderWidth: 1.5,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "58%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#d8e4f0",
          font: { family: "Inter, sans-serif", size: 12 },
          padding: 18,
        },
      },
      tooltip: {
        backgroundColor: "rgba(6,23,43,0.96)",
        borderColor: "rgba(200,164,77,0.45)",
        borderWidth: 1,
        titleColor: "#f2e3b0",
        bodyColor: "#eef4fb",
      },
    },
  };

  return (
    <div className="panel panel-medium">
      <div className="panel-header">
        <div>
          <h3>Rule Compliance</h3>
          <p>Passed versus failed cockpit attention checks</p>
        </div>
      </div>
      <div className="chart-wrap chart-wrap-doughnut">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
