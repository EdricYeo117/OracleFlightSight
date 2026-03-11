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