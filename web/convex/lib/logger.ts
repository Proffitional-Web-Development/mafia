/**
 * Structured logging utility for Convex functions.
 *
 * Usage:
 *   import { logger } from "./lib/logger";
 *   logger.info("game.start", { gameId, roomId, playerCount: 8 });
 *   logger.warn("cleanup.reschedule", { gameId, remaining: 42 });
 *   logger.error("vote.invalid", { voterId, reason: "already voted" });
 *
 * All entries are JSON-serialisable and will appear in the Convex dashboard
 * logs where they can be filtered by level/event.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogPayload {
  level: LogLevel;
  event: string;
  ts: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const payload: LogPayload = {
    level,
    event,
    ts: new Date().toISOString(),
    ...data,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(payload));
      break;
    case "warn":
      console.warn(JSON.stringify(payload));
      break;
    case "debug":
      console.debug(JSON.stringify(payload));
      break;
    default:
      console.log(JSON.stringify(payload));
  }
}

export const logger = {
  debug: (event: string, data?: Record<string, unknown>) =>
    emit("debug", event, data),
  info: (event: string, data?: Record<string, unknown>) =>
    emit("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) =>
    emit("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) =>
    emit("error", event, data),
};
