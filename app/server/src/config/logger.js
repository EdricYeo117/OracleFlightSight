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