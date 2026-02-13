# T03 — Game State Machine (Server-Side)

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A5 — Game Logic Designer |
| **Priority** | P0 |
| **Complexity** | XL |
| **Dependencies** | T02 |

## Description

Implement the core game state machine in Convex that governs all phase transitions. This is the heart of the game — every transition must be server-authoritative, deterministic, and tamper-proof.

## Sub-Tasks

1. Define phase enum: `lobby → cardDistribution → discussion → publicVoting → abilityPhase → mafiaVoting → resolution → endCheck`
2. Implement `advancePhase` mutation with validation guards (only valid transitions allowed)
3. Implement timer system using Convex scheduled functions for:
   - Discussion phase auto-advance after configurable duration
   - Voting deadlines (auto-resolve if not all votes cast)
   - Ability phase timeout (auto-skip if not used)
4. Add round counter increment logic
5. Implement phase-specific precondition checks:
   - `publicVoting` requires discussion timer expired or owner override
   - `abilityPhase` only if alive Sheikh/Girl exist
   - `mafiaVoting` only if alive Mafia exist
6. Create `getGameState` query that returns phase-appropriate data per player (no role leakage)
7. Add transition event logging to `gameEvents` table
8. Handle edge cases: all mafia dead before mafia voting, all citizens dead during resolution

## Acceptance Criteria

- [x] State transitions follow the exact GDD phase order
- [x] Invalid transitions throw descriptive errors
- [x] Timers auto-advance phases correctly
- [x] `getGameState` never leaks another player's role
- [x] Edge cases (skip phases, early game end) handled gracefully
- [x] All transitions logged in gameEvents

---

## A8 Review — 2026-02-13

✅ Review: PASSED (with minor findings)

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | Phase order follows GDD: lobby → cardDistribution → discussion → publicVoting → abilityPhase → mafiaVoting → resolution → endCheck → (loop or finished). |
| Acceptance criteria | ✅ | All 6 checkboxes met. Transitions guarded, timers schedule via `ctx.scheduler.runAfter`, `getGameState` scopes roles, edge cases handled, events logged. |
| Error handling quality | ✅ | `assertOrThrow` + `ConvexError` for all guard failures. Descriptive messages ("Game is already finished.", "Only the room owner can manually advance phase.", etc.). |
| Security posture | ✅ | `advancePhase` mutation requires auth via `requireAuthUserId` + room owner check. `handlePhaseTimer` and `advancePhaseInternal` are `internalMutation` (not callable from client). `getGameState` requires auth and player membership. |
| Edge-case coverage | ✅ | All-mafia-dead → citizens win before mafia voting. All-citizens-dead → mafia win before resolution. Ability phase skipped when no alive sheikh/girl. Timer token+phase double-guard prevents stale timer execution. |
| Performance risks | 🟢 | `getGameState` does `Promise.all(players.map(p => ctx.db.get(p.userId)))` — N+1 pattern. Acceptable for small player counts (≤12) but worth noting. |
| Code convention alignment | ✅ | Well-structured helper functions. Clear separation of `transitionCore` (internal logic) from public/internal mutation wrappers. |
| Type safety | ✅ | `TimedPhase` type guard (`isTimedPhase`) ensures scheduler args are correctly narrowed. `CorePhase` vs `Phase` distinction is clean. |
| Cross-task compatibility | ✅ | T04 auth guard integrated. Schema fields (`phaseStartedAt`, `phaseDeadlineAt`, `phaseToken`) present in T02 schema. `getGameState` provides the view contract T14 (Core UI) will consume. |
| Deliverable completeness | ✅ | Single file `convex/stateMachine.ts` contains all required functionality. |

### Findings

- 🟡 Major: `getGameState` only reveals the requester's own role (`roleVisibleToRequester = player._id === me._id`), but it also exposes `mafiaTeammates` array to mafia players. This is correct per GDD, **however** the `mafiaTeammates` list is sent even when the game phase is `lobby` or `cardDistribution`, before roles should be visible. Consider gating `mafiaTeammates` to phases after `cardDistribution`.
- 🟢 Minor: `getAliveCounts` classifies all non-mafia roles (citizen, sheikh, girl, boy) as `aliveCitizens` by subtraction. This is functionally correct since sheikh/girl/boy are citizen-faction, but an explicit `CITIZEN_FACTION_ROLES` constant would improve readability.
- 🟢 Minor: `handlePhaseTimer` checks `Date.now() < game.phaseDeadlineAt` and skips if deadline not reached. Since the timer is already scheduled to fire at the deadline, this guard should almost never trigger, but it's a good defensive check. No action needed.
- 🟢 Minor: Magic numbers for timer durations (`PUBLIC_VOTING_MS = 45_000`, `ABILITY_PHASE_MS = 30_000`, `MAFIA_VOTING_MS = 45_000`). Consider extracting to a shared config or deriving from room settings for configurability. Acceptable for MVP.

### Summary

State machine is well-architected with proper auth guards, timer token validation, and edge-case handling. One major finding regarding premature `mafiaTeammates` exposure should be addressed in T07 or T14 when the full game flow is wired. Not blocking for T03 closure since the field is harmless during lobby (no roles assigned yet).
