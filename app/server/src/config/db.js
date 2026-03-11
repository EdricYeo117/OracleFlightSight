import oracledb from "oracledb";
import { env } from "./env.js";

let pool;

export async function initDb() {
  if (pool) return pool;

  pool = await oracledb.createPool({
    user: env.ORACLE_USER,
    password: env.ORACLE_PASSWORD,
    connectString: env.ORACLE_CONNECT_STRING,
    poolMin: 1,
    poolMax: 10,
    poolIncrement: 1,
  });

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