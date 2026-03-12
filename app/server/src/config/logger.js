/**
 * Module: app/server/src/config/logger.js
 * Layer: Backend
 * Purpose:
 * - Implements the logger unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import pino from "pino";

const level = process.env.LOG_LEVEL || "debug";

const logger = pino({
  level,
  base: {
    service: "oracleflightsight-backend",
  },
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

export default logger;