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

import FlightSimulatorTracked from "./components/FlightAnalytics/FlightSimulatorTracked";

export default function App() {
  return <FlightSimulatorTracked />;
}