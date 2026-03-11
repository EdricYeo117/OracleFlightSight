import oracledb from "oracledb";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let pool;

export async function initDb() {
  if (pool) return pool;

  const walletDir = process.env.ORACLE_WALLET_DIR;

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

  console.log("Oracle pool created with wallet");
  return pool;
}

export async function getConnection() {
  if (!pool) {
    await initDb();
  }
  return pool.getConnection();
}

export async function closeDb() {
  if (pool) {
    await pool.close(10);
    pool = null;
  }
}