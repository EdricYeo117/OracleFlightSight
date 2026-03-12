/**
 * Module: app/server/src/server.js
 * Layer: Backend
 * Purpose:
 * - Implements the server unit used by the OracleFlightSight application.
 * - Encapsulates this file's logic so related features remain discoverable and maintainable.
 * Documentation notes:
 * - Keep this file-level description in sync when responsibilities or interfaces change.
 * - Prefer adding JSDoc to exported functions/components and major internal helpers.
 */

import app from "./app.js";
import { initDb } from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 4000;

async function main() {
  try {
    logger.info({ port: PORT }, "starting backend");
    await initDb();
    logger.info("database initialized");

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "server listening");
    });
  } catch (err) {
    logger.error({ err }, "failed to start backend");
    process.exit(1);
  }
}

main();