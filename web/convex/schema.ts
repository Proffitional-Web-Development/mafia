import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const ROOM_STATUSES = ["waiting", "in-game", "finished"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const GAME_PHASES = [
  "lobby",
  "cardDistribution",
  "discussion",
  "publicVoting",
  "abilityPhase",
  "mafiaVoting",
  "resolution",
  "endCheck",
  "finished",
] as const;
export type GamePhase = (typeof GAME_PHASES)[number];

export const PLAYER_ROLES = [
  "mafia",
  "citizen",
  "sheikh",
  "girl",
  "boy",
] as const;
export type PlayerRole = (typeof PLAYER_ROLES)[number];

export const FACTIONS = ["mafia", "citizens"] as const;
export type Faction = (typeof FACTIONS)[number];

export const VOTE_PHASES = ["public", "mafia"] as const;
export type VotePhase = (typeof VOTE_PHASES)[number];

export const ACTION_ROLES = ["sheikh", "girl", "boy"] as const;
export type ActionRole = (typeof ACTION_ROLES)[number];

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    username: v.optional(v.string()),
    usernameLower: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    musicEnabled: v.optional(v.boolean()),
    createdAt: v.optional(v.number()),
    stats: v.optional(
      v.object({
        gamesPlayed: v.number(),
        wins: v.number(),
        losses: v.number(),
      })
    ),
  })
    .index("phone", ["phone"])
    .index("by_username", ["username"])
    .index("by_usernameLower", ["usernameLower"])
    .index("by_createdAt", ["createdAt"]),

  rooms: defineTable({
    code: v.string(),
    ownerId: v.id("users"),
    visibility: v.optional(
      v.union(v.literal("public"), v.literal("private")),
    ),
    password: v.optional(v.string()),
    memeLevel: v.optional(v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS"))),
    settings: v.object({
      discussionDuration: v.number(),
      maxPlayers: v.number(),
      mafiaCount: v.optional(v.number()),
      enabledRoles: v.object({
        sheikh: v.boolean(),
        girl: v.boolean(),
        boy: v.boolean(),
      }),
    }),
    status: v.union(
      v.literal("waiting"),
      v.literal("in-game"),
      v.literal("finished")
    ),
    currentGameId: v.optional(v.id("games")),
    createdAt: v.number(),
    lastActivityAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_ownerId", ["ownerId"])
    .index("by_status", ["status"])
    .index("by_status_visibility", ["status", "visibility"])
    .index("by_lastActivityAt", ["lastActivityAt"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    joinedAt: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_userId", ["userId"])
    .index("by_roomId_userId", ["roomId", "userId"]),

  games: defineTable({
    roomId: v.id("rooms"),
    phase: v.union(
      v.literal("lobby"),
      v.literal("cardDistribution"),
      v.literal("discussion"),
      v.literal("publicVoting"),
      v.literal("abilityPhase"),
      v.literal("mafiaVoting"),
      v.literal("resolution"),
      v.literal("endCheck"),
      v.literal("finished")
    ),
    round: v.number(),
    startedAt: v.number(),
    phaseStartedAt: v.optional(v.number()),
    phaseDeadlineAt: v.optional(v.number()),
    phaseToken: v.optional(v.number()),
    votingSubRound: v.optional(v.number()),
    tiedCandidates: v.optional(v.array(v.id("players"))),
    endedAt: v.optional(v.number()),
    winnerFaction: v.optional(
      v.union(v.literal("mafia"), v.literal("citizens"))
    ),
  })
    .index("by_roomId", ["roomId"])
    .index("by_phase", ["phase"]),

  players: defineTable({
    gameId: v.id("games"),
    userId: v.id("users"),
    role: v.union(
      v.literal("mafia"),
      v.literal("citizen"),
      v.literal("sheikh"),
      v.literal("girl"),
      v.literal("boy")
    ),
    isAlive: v.boolean(),
    isConnected: v.boolean(),
    eliminatedAtRound: v.optional(v.number()),
    joinedAt: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_userId", ["userId"])
    .index("by_gameId_userId", ["gameId", "userId"])
    .index("by_gameId_isAlive", ["gameId", "isAlive"]),

  votes: defineTable({
    gameId: v.id("games"),
    round: v.number(),
    phase: v.union(v.literal("public"), v.literal("mafia")),
    voterId: v.id("players"),
    targetId: v.optional(v.id("players")),
    isSkip: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_round", ["gameId", "round"])
    .index("by_gameId_round_phase", ["gameId", "round", "phase"])
    .index("by_gameId_round_phase_voterId", [
      "gameId",
      "round",
      "phase",
      "voterId",
    ]),

  actions: defineTable({
    gameId: v.id("games"),
    round: v.number(),
    role: v.union(v.literal("sheikh"), v.literal("girl"), v.literal("boy")),
    actorId: v.id("players"),
    targetId: v.optional(v.id("players")),
    result: v.optional(v.string()),
    confirmed: v.optional(v.boolean()),
    timestamp: v.number(),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_round", ["gameId", "round"])
    .index("by_gameId_round_role", ["gameId", "round", "role"])
    .index("by_gameId_round_actorId", ["gameId", "round", "actorId"]),

  gameEvents: defineTable({
    gameId: v.id("games"),
    eventType: v.optional(v.union(
      v.literal("VOTE_ELIMINATION"),
      v.literal("MAFIA_ELIMINATION"),
      v.literal("MAFIA_FAILED_ELIMINATION"),
      v.literal("SHEIKH_INVESTIGATION_CITIZEN"),
      v.literal("SHEIKH_INVESTIGATION_MAFIA"),
      v.literal("ROUND_END"),
      v.literal("VOTE_TIE"),
      v.literal("MAFIA_VOTE_TIE_RANDOM")
    )),
    resolvedMessage: v.optional(v.string()),
    messageKey: v.optional(v.string()),
    messageParams: v.optional(v.any()),
    round: v.number(),
    timestamp: v.number(),
    memeLevel: v.optional(v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS"))),
    type: v.optional(v.string()),
    payload: v.optional(v.string()),
  })
    .index("by_gameId", ["gameId"])
    .index("by_gameId_round", ["gameId", "round"])
    .index("by_gameId_timestamp", ["gameId", "timestamp"]),
});
