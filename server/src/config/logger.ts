import pino from "pino";
import { isProduction } from "./env";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  base: undefined,
  redact: ["req.headers.authorization", "password", "passwordHash", "token"]
});
