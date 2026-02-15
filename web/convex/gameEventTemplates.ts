export type GameEventType =
  | "VOTE_ELIMINATION"
  | "MAFIA_ELIMINATION"
  | "MAFIA_FAILED_ELIMINATION"
  | "SHEIKH_INVESTIGATION_CITIZEN"
  | "SHEIKH_INVESTIGATION_MAFIA"
  | "ROUND_END"
  | "VOTE_TIE"
  | "MAFIA_VOTE_TIE_RANDOM"
  | "OWNER_PROMOTED_COORDINATOR";

export type MemeLevel = "NORMAL" | "FUN" | "CHAOS";

const TEMPLATES: Record<GameEventType, Record<MemeLevel, string[]>> = {
  VOTE_ELIMINATION: {
    NORMAL: [
      "events.VOTE_ELIMINATION.normal.1",
      "events.VOTE_ELIMINATION.normal.2",
    ],
    FUN: [
      "events.VOTE_ELIMINATION.fun.1",
      "events.VOTE_ELIMINATION.fun.2",
      "events.VOTE_ELIMINATION.fun.3",
    ],
    CHAOS: [
      "events.VOTE_ELIMINATION.chaos.1",
      "events.VOTE_ELIMINATION.chaos.2",
      "events.VOTE_ELIMINATION.chaos.3",
    ],
  },
  MAFIA_ELIMINATION: {
    NORMAL: [
      "events.MAFIA_ELIMINATION.normal.1",
      "events.MAFIA_ELIMINATION.normal.2",
    ],
    FUN: [
      "events.MAFIA_ELIMINATION.fun.1",
      "events.MAFIA_ELIMINATION.fun.2",
      "events.MAFIA_ELIMINATION.fun.3",
    ],
    CHAOS: [
      "events.MAFIA_ELIMINATION.chaos.1",
      "events.MAFIA_ELIMINATION.chaos.2",
      "events.MAFIA_ELIMINATION.chaos.3",
    ],
  },
  MAFIA_FAILED_ELIMINATION: {
    NORMAL: [
      "events.MAFIA_FAILED_ELIMINATION.normal.1",
      "events.MAFIA_FAILED_ELIMINATION.normal.2",
    ],
    FUN: [
      "events.MAFIA_FAILED_ELIMINATION.fun.1",
      "events.MAFIA_FAILED_ELIMINATION.fun.2",
      "events.MAFIA_FAILED_ELIMINATION.fun.3",
    ],
    CHAOS: [
      "events.MAFIA_FAILED_ELIMINATION.chaos.1",
      "events.MAFIA_FAILED_ELIMINATION.chaos.2",
      "events.MAFIA_FAILED_ELIMINATION.chaos.3",
    ],
  },
  SHEIKH_INVESTIGATION_CITIZEN: {
    NORMAL: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.normal.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.normal.2",
    ],
    FUN: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.2",
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.3",
    ],
    CHAOS: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.2",
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.3",
    ],
  },
  SHEIKH_INVESTIGATION_MAFIA: {
    NORMAL: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.normal.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.normal.2",
    ],
    FUN: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.2",
      "events.SHEIKH_INVESTIGATION_CITIZEN.fun.3",
    ],
    CHAOS: [
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.1",
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.2",
      "events.SHEIKH_INVESTIGATION_CITIZEN.chaos.3",
    ],
  },
  ROUND_END: {
    NORMAL: ["events.ROUND_END.normal.1", "events.ROUND_END.normal.2"],
    FUN: [
      "events.ROUND_END.fun.1",
      "events.ROUND_END.fun.2",
      "events.ROUND_END.fun.3",
    ],
    CHAOS: [
      "events.ROUND_END.chaos.1",
      "events.ROUND_END.chaos.2",
      "events.ROUND_END.chaos.3",
    ],
  },
  VOTE_TIE: {
    NORMAL: ["events.VOTE_TIE.normal.1", "events.VOTE_TIE.normal.2"],
    FUN: [
      "events.VOTE_TIE.fun.1",
      "events.VOTE_TIE.fun.2",
      "events.VOTE_TIE.fun.3",
    ],
    CHAOS: [
      "events.VOTE_TIE.chaos.1",
      "events.VOTE_TIE.chaos.2",
      "events.VOTE_TIE.chaos.3",
    ],
  },
  MAFIA_VOTE_TIE_RANDOM: {
    NORMAL: [
      "events.MAFIA_VOTE_TIE_RANDOM.normal.1",
      "events.MAFIA_VOTE_TIE_RANDOM.normal.2",
    ],
    FUN: [
      "events.MAFIA_VOTE_TIE_RANDOM.fun.1",
      "events.MAFIA_VOTE_TIE_RANDOM.fun.2",
      "events.MAFIA_VOTE_TIE_RANDOM.fun.3",
    ],
    CHAOS: [
      "events.MAFIA_VOTE_TIE_RANDOM.chaos.1",
      "events.MAFIA_VOTE_TIE_RANDOM.chaos.2",
      "events.MAFIA_VOTE_TIE_RANDOM.chaos.3",
    ],
  },
  OWNER_PROMOTED_COORDINATOR: {
    NORMAL: ["events.OWNER_PROMOTED_COORDINATOR.normal"],
    FUN: ["events.OWNER_PROMOTED_COORDINATOR.fun"],
    CHAOS: ["events.OWNER_PROMOTED_COORDINATOR.chaos"],
  },
};

export function pickRandomTemplate(
  eventType: GameEventType,
  memeLevel: MemeLevel = "FUN",
): string {
  const templates = TEMPLATES[eventType][memeLevel];
  if (!templates || templates.length === 0) {
    // Fallback to normal if specified level is missing (should verify this doesn't happen)
    return TEMPLATES[eventType].NORMAL[0];
  }
  const index = Math.floor(Math.random() * templates.length);
  return templates[index];
}
