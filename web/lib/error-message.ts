export type AppErrorKey =
  | "sessionExpired"
  | "cookiesBlocked"
  | "network"
  | "roomNotFound"
  | "roomFull"
  | "gameAlreadyStarted"
  | "unknown";

function normalizeMessage(input: unknown): string {
  if (input instanceof Error) {
    return input.message.toLowerCase();
  }
  return String(input ?? "").toLowerCase();
}

export function mapAppErrorKey(input: unknown): AppErrorKey {
  const message = normalizeMessage(input);

  if (
    message.includes("missing refreshtoken cookie") ||
    (message.includes("refreshtoken") && message.includes("cookie")) ||
    message.includes("third-party cookie")
  ) {
    return "cookiesBlocked";
  }

  if (
    message.includes("session") ||
    message.includes("unauthorized") ||
    message.includes("not authenticated") ||
    message.includes("auth")
  ) {
    return "sessionExpired";
  }

  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("econn")
  ) {
    return "network";
  }

  if (
    (message.includes("room") && message.includes("not found")) ||
    message.includes("roomnotfound")
  ) {
    return "roomNotFound";
  }

  if (
    (message.includes("room") && message.includes("full")) ||
    message.includes("roomfull") ||
    message.includes("max players")
  ) {
    return "roomFull";
  }

  if (
    (message.includes("game") &&
      message.includes("already") &&
      message.includes("start")) ||
    message.includes("already started") ||
    message.includes("gamealreadystarted")
  ) {
    return "gameAlreadyStarted";
  }

  return "unknown";
}
