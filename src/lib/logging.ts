import { pino } from "pino";
import pinoPretty from "pino-pretty";

const prettyStream = pinoPretty({
  colorize: true,
  translateTime: "SYS:standard",
  ignore: "pid,hostname",
  errorLikeObjectKeys: ["err", "error"],
});

export const logger = pino(
  {
    level: process.env.LOG_LEVEL || "info",
  },
  prettyStream,
);
