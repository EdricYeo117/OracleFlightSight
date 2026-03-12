import React, { useState } from "react";
import FlightSimulatorTracked from "./components/FlightTracking/FlightSimulatorTracked.jsx";
import FlightAnalyticsDashboard from "./components/FlightAnalytics/FlightAnalyticsDashboard.jsx";
import "./appShell.css";
/**
 * Module: app/src/App.tsx
 * Layer: Frontend
 * Purpose:
 * - Implements the App unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

export default function App() {
  const [activeTab, setActiveTab] = useState("simulator");

  return (
    <div className="app-shell">
      <div className="app-topbar">
        <div className="app-topbar-brand">
          <div className="app-topbar-badge">SIA</div>
          <div>
            <div className="app-topbar-title">Singapore Airlines</div>
            <div className="app-topbar-subtitle">
              Flight Crew Attention Analytics
            </div>
          </div>
        </div>

        <div className="app-topbar-tabs">
          <button
            className={activeTab === "simulator" ? "app-tab active" : "app-tab"}
            onClick={() => setActiveTab("simulator")}
          >
            Simulator
          </button>
          <button
            className={activeTab === "analytics" ? "app-tab active" : "app-tab"}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === "simulator" ? (
        <FlightSimulatorTracked />
      ) : (
        <FlightAnalyticsDashboard />
      )}
    </div>
  );
}
