# T07 — Card Distribution & Role Assignment

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A5 — Game Logic Designer |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T03, T06 |

## Description

Implement secure, server-side role assignment based on room settings and player count.

## Sub-Tasks

1. Design role distribution algorithm:
   - Calculate mafia count based on player count (e.g., ~1/3 mafia, min 1)
   - Assign exactly 1 Sheikh and 1 Girl (if enabled in room settings)
   - Fill remaining citizen slots with Boy or plain Citizen
   - Support configurable enabled/disabled roles per room
2. Implement `distributeCards` internal mutation (called by `startGame`):
   - Shuffle player list using cryptographically random seed
   - Assign roles to `players` table
   - Store role in server-only field (never sent raw to client)
3. Create `getMyRole` query: returns only the requesting player's own role
4. Create `getMafiaTeammates` query: returns mafia member list ONLY if requester is mafia
5. Build card reveal UI:
   - Full-screen role reveal animation (flip card effect)
   - Role name, icon, and ability description
   - Mafia players see teammate list after reveal
   - "Ready" button to confirm card seen
6. Handle edge cases:
   - Fewer players than required roles (skip optional roles)
   - Exactly 3 players (1 mafia, 2 citizens, minimal roles)

## Acceptance Criteria

- [ ] Roles distributed correctly per player count
- [ ] No player sees another player's role (except mafia seeing mafia)
- [ ] Room setting toggles respected (disabled roles not assigned)
- [ ] Card reveal animation works on mobile
- [ ] Distribution is random and non-deterministic across games
- [ ] Edge case: 3-player game assigns valid factions
