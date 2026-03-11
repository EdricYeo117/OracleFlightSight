import pinoHttp from "pino-http";
import logger from "../config/logger.js";

const requestLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.headers["x-request-id"] || crypto.randomUUID?.() || undefined,
    route: req.url,
    method: req.method,
  }),
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        headers: {
          "content-type": req.headers["content-type"],
          "user-agent": req.headers["user-agent"],
          origin: req.headers.origin,
        },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

export default requestLogger;