import oracledb from "oracledb";
import logger from "./logger.js";
import dotenv from "dotenv";
dotenv.config();

let pool;

export async function initDb() {
  if (pool) return pool;

  const walletDir = process.env.ORACLE_WALLET_DIR;

  logger.info(
    {
      connectString: process.env.ORACLE_CONNECT_STRING,
      walletDir,
      user: process.env.ORACLE_USER,
    },
    "creating oracle pool"
  );

  pool = await oracledb.createPool({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECT_STRING,
    configDir: walletDir,
    walletLocation: walletDir,
    walletPassword: process.env.ORACLE_WALLET_PASSWORD,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });

  logger.info(
    {
      poolMin: 1,
      poolMax: 10,
    },
    "oracle pool created"
  );

  return pool;
}

export async function getConnection() {
  if (!pool) {
    logger.warn("pool not initialized yet, initializing now");
    await initDb();
  }

  logger.debug("acquiring oracle connection");
  const conn = await pool.getConnection();
  logger.debug("oracle connection acquired");
  return conn;
}