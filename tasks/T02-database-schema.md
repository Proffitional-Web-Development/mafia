# T02 — Convex Database Schema Design

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T01 |

## Description

Design and implement the full Convex schema covering users, rooms, games, players, roles, votes, actions, and game events.

## Sub-Tasks

1. Define `users` table: id, username, avatarUrl, createdAt, stats
2. Define `rooms` table: code, ownerId, settings (discussionDuration, maxPlayers, enabledRoles), status (waiting/in-game/finished)
3. Define `games` table: roomId, phase, round, startedAt, endedAt, winnerFaction
4. Define `players` table: gameId, userId, role, isAlive, isConnected, eliminatedAtRound
5. Define `votes` table: gameId, round, phase (public/mafia), voterId, targetId, timestamp
6. Define `actions` table: gameId, round, role (sheikh/girl), actorId, targetId, result
7. Define `gameEvents` table: gameId, round, type, payload, timestamp (audit log)
8. Add appropriate indexes for all query patterns (by gameId, by roomId, by phase, etc.)
9. Document field-level access control strategy (which fields are hidden from which players)

## Acceptance Criteria

- [x] `convex/schema.ts` compiles and deploys successfully
- [x] All tables have proper TypeScript types exported
- [x] Indexes cover: room lookup by code, players by game, votes by round, actions by round
- [x] Schema documentation matches GDD requirements
- [x] No sensitive fields (role, mafia identity) exposed without scoping

---

## A8 Review — 2026-02-13

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | Schema deploys successfully to Convex. All 7 tables defined. |
| Acceptance criteria | ✅ | All 5 checkboxes met. Types exported, indexes cover required patterns, SCHEMA.md documents access control. |
| Error handling quality | ✅ | N/A for schema definition. |
| Security posture | ✅ | `SCHEMA.md` explicitly documents that `players.role` is private, mafia votes are role-gated, and action results are actor-only. Server-authoritative invariants stated. |
| Edge-case coverage | ✅ | `votes.targetId` is `v.optional` allowing skip votes. `actions.result` is `v.optional` for pending outcomes. |
| Performance risks | ✅ | Compound indexes (`by_gameId_round_phase`, `by_gameId_round_phase_voterId`, `by_gameId_round_role`) cover expected hot query paths. |
| Code convention alignment | ✅ | Consistent use of `v.literal` unions, `as const` type exports, camelCase fields. |
| Type safety | ✅ | `GAME_PHASES`, `PLAYER_ROLES`, `FACTIONS`, `VOTE_PHASES`, `ACTION_ROLES` exported as `const` with derived types. |
| Cross-task compatibility | ✅ | T03 `stateMachine.ts` and T04 `users.ts` consume schema correctly. `phaseStartedAt`/`phaseDeadlineAt`/`phaseToken` fields added for T03 timer system. Auth-compatible user fields (`email`, `phone`, `isAnonymous`, etc.) integrated for T04. |
| Deliverable completeness | ✅ | `convex/schema.ts` + `convex/SCHEMA.md` both present and complete. |

### Findings

- 🟢 Minor: `gameEvents.payload` is typed as `v.string()` (JSON-stringified). A structured `v.any()` or typed union would improve developer experience and allow Convex dashboard filtering. Acceptable for now given audit-log nature.
- 🟢 Minor: `users.stats` is `v.optional(v.object(...))` — new users have no stats until `completeProfile` initializes them. Consider initializing stats at user creation time in the auth store callback to guarantee the field is always present.
- 🟢 Minor: No `rooms.by_status_createdAt` compound index for listing active rooms with pagination. Will likely be needed by T06 (Room System). Flag for that task.

### Summary

Schema is comprehensive, well-indexed, and correctly typed. Access control strategy is documented. No blocking issues.
