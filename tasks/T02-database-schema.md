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

- [ ] `convex/schema.ts` compiles and deploys successfully
- [ ] All tables have proper TypeScript types exported
- [ ] Indexes cover: room lookup by code, players by game, votes by round, actions by round
- [ ] Schema documentation matches GDD requirements
- [ ] No sensitive fields (role, mafia identity) exposed without scoping
