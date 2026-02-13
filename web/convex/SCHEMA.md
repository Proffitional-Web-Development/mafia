# Convex Schema (T02)

This schema supports the full game loop for rooms, game state, player roles, voting, abilities, and audit events.

## Tables

- `users`: player profile + aggregate stats.
- `rooms`: lobby/configuration + owner + room status.
- `games`: per-room game instance and phase progression.
- `players`: per-game participant state, role, alive/connectivity.
- `votes`: round-scoped votes for `public` and `mafia` phases.
- `actions`: round-scoped ability usage and results.
- `gameEvents`: append-only audit/event stream.

## Key Indexes

- Room lookup by code: `rooms.by_code`.
- Players by game: `players.by_gameId`.
- Votes by round: `votes.by_gameId_round_phase`.
- Actions by round: `actions.by_gameId_round`.

## Field-Level Access Strategy

Never trust the client for game authority; all sensitive filtering must happen in server queries.

### Public to all room members

- `rooms`: `code`, non-sensitive `settings`, `status`, `ownerId`.
- `games`: `phase`, `round`, `startedAt`, `endedAt`, `winnerFaction` after game end.
- `players`: `userId`, `isAlive`, `isConnected`, `eliminatedAtRound`.
- `votes` (public phase only): aggregate tally, not raw hidden identities unless phase rules require visibility.
- `gameEvents`: only sanitized event payloads safe for all players.

### Private / role-gated

- `players.role`: private by default; only requester's own role and allowed mafia teammate views.
- `votes` with `phase = mafia`: visible only to alive mafia.
- `actions`:
  - Sheikh investigation results visible only to that Sheikh.
  - Girl protection target/result never publicly exposed during active game.
- `gameEvents.payload`: redact sensitive keys before returning to non-authorized players.

### Server-authoritative invariants

- Mutations validate phase, role, alive status, and round before writes.
- Client never sets `role`, elimination outcomes, or win state directly.
- All transitions and eliminations are logged via `gameEvents`.
