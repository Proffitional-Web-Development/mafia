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

- [ ] State transitions follow the exact GDD phase order
- [ ] Invalid transitions throw descriptive errors
- [ ] Timers auto-advance phases correctly
- [ ] `getGameState` never leaks another player's role
- [ ] Edge cases (skip phases, early game end) handled gracefully
- [ ] All transitions logged in gameEvents
