# T09 — Public Voting Phase

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T08 |

## Description

Implement the public voting system where all alive players vote to eliminate a suspect.

## Backend Sub-Tasks

1. `castPublicVote` mutation: validates voter is alive, target is alive, stores/updates vote
2. Allow vote changes until voting is finalized (update existing vote record)
3. `getPublicVotes` query: returns current vote tally (visible to all)
4. `confirmVoting` mutation (owner-only): locks votes and resolves
5. Vote resolution logic:
   - Player with most votes is eliminated
   - Tie-breaking: no elimination on tie (configurable)
   - Record result in `gameEvents`
6. Timeout handling: auto-resolve votes after deadline
7. Prevent dead players from voting
8. Add "skip vote" / "no elimination" option

## Frontend Sub-Tasks

9. Voting grid: all alive players as selectable targets
10. Visual vote indicators (who voted for whom — public)
11. Vote count badges on each player
12. "Change Vote" interaction (tap different player)
13. Owner "Confirm Results" button
14. Vote result announcement screen (who was eliminated or no elimination)
15. Eliminated player visual treatment (grayed out, skull icon)

## Acceptance Criteria

- [x] All alive players can cast exactly one vote
- [x] Votes are changeable before confirmation
- [x] Vote tallies update in real-time for all players
- [x] Owner confirms and resolves voting
- [x] Tie results in no elimination
- [x] Dead players cannot vote
- [x] Elimination recorded and player marked as dead

---

## A8 Review — 2026-02-13 (Backend)

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | Vote cast/update, skip vote, tally query, owner confirmation, and timeout auto-resolve all function as specified. |
| Acceptance criteria | ✅ | One active vote per alive voter, changeable pre-resolution, live tally visibility, tie/no-elimination handling, and dead-player blocking are implemented. |
| Error handling quality | ✅ | Robust validation for phase, membership, alive status, target validity, and owner authorization. |
| Security posture | ✅ | Only authenticated game participants can query/cast; privileged confirm path is owner-guarded. |
| Edge-case coverage | ✅ | No-vote, tie, and skip-dominant outcomes are explicitly handled and event-logged. |
| Performance risks | ✅ | Tally computation is linear in vote count and bounded by room size. |
| Code convention alignment | ✅ | Shared resolver helper and internal timeout resolver follow established backend style. |
| Type safety | ✅ | Proper Convex arg validators and typed IDs across mutation/query paths. |
| Cross-task compatibility | ✅ | Transition handoff to state machine and downstream resolution event consumption are aligned with T10–T12. |
| Deliverable completeness | ✅ | All backend sub-tasks for public voting are implemented. |

