/**
 * Module: app/src/main.tsx
 * Layer: Frontend
 * Purpose:
 * - Implements the main unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { WebgazerProvider } from "@webgazer-ts/react";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WebgazerProvider>
      <App />
    </WebgazerProvider>
  </React.StrictMode>
);