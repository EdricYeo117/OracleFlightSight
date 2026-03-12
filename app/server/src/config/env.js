/**
 * Module: app/server/src/config/env.js
 * Layer: Backend
 * Purpose:
 * - Implements the env unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",

  ORACLE_USER: process.env.ORACLE_USER || "",
  ORACLE_PASSWORD: process.env.ORACLE_PASSWORD || "",
  ORACLE_CONNECT_STRING: process.env.ORACLE_CONNECT_STRING || ""
};