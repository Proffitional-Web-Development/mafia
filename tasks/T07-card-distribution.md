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

---

## A5 Game Logic Specification (2026-02-13)

### 1) Role Distribution Rules (Authoritative)

1. Distribution runs only when game phase is `cardDistribution` and player count is `>= 3`.
2. Mafia count is deterministic by player count:
   - `3–5 => 1 mafia`
   - `6–8 => 2 mafia`
   - `9–12 => 3 mafia`
   - `13+ => 4 mafia`
3. Citizen-faction slots are computed as `playerCount - mafiaCount`.
4. Optional citizen special roles are assigned in strict order, one each max:
   - `sheikh` (if enabled and slot remains)
   - `girl` (if enabled and slot remains)
   - `boy` (if enabled and slot remains)
5. All remaining citizen-faction slots are assigned `citizen`.
6. Final role list length must equal `playerCount` before assignment.
7. Role list is shuffled with cryptographic randomness before writing player roles.

### 2) Visibility & Information Security Rules

1. `getMyRole` returns only the requester’s own role object.
2. `getMafiaTeammates` returns teammate list only when requester role is `mafia`; otherwise returns empty array.
3. Role-reveal queries return no role data until distribution has completed (cards distributed event exists).
4. Role/teammate visibility is blocked in `lobby` phase.
5. No API may return another non-mafia player’s exact role.

### 3) Transition Constraints for This Task

1. This task does not auto-advance phase; phase remains `cardDistribution` after assignment.
2. Advancement to `discussion` is handled by state machine controls (owner/manual/timer flow from T03/T08 integration).
3. Card distribution must be idempotent with respect to phase guard (cannot run outside `cardDistribution`).

## Edge-Case Matrix

| Case | Inputs | Expected Result |
|------|--------|-----------------|
| Minimum valid game | 3 players, all roles enabled | `1 mafia`, `1 sheikh`, `1 girl` (boy skipped, no citizen slot left) |
| Not enough players | 2 players | Distribution rejected with descriptive error |
| Optional roles disabled | 6 players, all optional disabled | `2 mafia`, `4 citizen` |
| Single citizen slot | 5 players, all optional enabled | `1 mafia`, `1 sheikh`, remaining citizens; `girl/boy` skipped if slots exhausted |
| Boy disabled | 8 players, sheikh+girl enabled, boy disabled | `2 mafia`, `1 sheikh`, `1 girl`, rest `citizen` |
| Distribution race window | `startGame` called; assignment in progress | `getMyRole` returns no role payload until cards distributed event exists |
| Non-mafia teammate query | Any phase with assigned roles, requester non-mafia | Empty list |
| Mafia teammate query | Assigned roles, requester mafia | Returns mafia teammates only (excluding requester) |

## Acceptance Test Scenarios (Implementation + QA)

1. **Role pool integrity**
   - Given player counts `3, 6, 9, 13`
   - When cards are distributed
   - Then mafia counts are `1, 2, 3, 4` respectively and total roles equal player count.

2. **Settings compliance**
   - Given room settings with each optional role disabled in turn
   - When cards are distributed
   - Then disabled roles never appear in assigned roles.

3. **No pre-distribution leakage**
   - Given game is in `cardDistribution` but assignment event not yet written
   - When player calls role queries
   - Then no role/teammate data is disclosed.

4. **Faction-only visibility**
   - Given assigned roles
   - When mafia player requests teammates
   - Then only mafia teammates are returned.
   - When citizen-faction player requests teammates
   - Then result is empty.

5. **Randomization sanity**
   - Given identical room settings and same player list
   - When running multiple games
   - Then assignment order varies across runs (non-deterministic outcomes observed).

## Notes / Underspec Resolution

- Interpreted “Fill remaining citizen slots with Boy or plain Citizen” as: assign at most one `boy` if enabled, then fill remainder with `citizen`.
- If product intends multiple `boy` cards, algorithm and schema constraints should be updated explicitly in a follow-up task.
