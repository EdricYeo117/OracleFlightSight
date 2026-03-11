import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 4000,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:5173",

  ORACLE_USER: process.env.ORACLE_USER || "",
  ORACLE_PASSWORD: process.env.ORACLE_PASSWORD || "",
  ORACLE_CONNECT_STRING: process.env.ORACLE_CONNECT_STRING || ""
};