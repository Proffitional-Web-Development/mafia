# T08 — Discussion Phase

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P0 |
| **Complexity** | S |
| **Dependencies** | T03, T07 |

## Description

Implement the timed discussion phase where players talk outside the system (voice/in-person). The system provides the timer and phase context.

## Sub-Tasks

1. Backend: Start discussion timer via Convex scheduled function (configurable duration)
2. Backend: `skipDiscussion` mutation (owner-only) to end early
3. Backend: Auto-advance to `publicVoting` when timer expires
4. Frontend: Full-screen discussion phase UI showing:
   - Countdown timer (mm:ss) with visual urgency at <30s
   - List of alive players with avatars
   - Current round number
   - "Discussion in progress" messaging
5. Frontend: Owner "End Discussion Early" button
6. Frontend: Phase transition animation from discussion → voting
7. Enhancement: Optional in-app text chat during discussion (P2, not required for v1)

## Acceptance Criteria

- [x] Timer counts down accurately in real-time
- [x] Timer synced across all clients (server-authoritative)
- [x] Phase auto-advances when timer hits zero
- [x] Owner can end discussion early
- [x] Dead players see "spectating" state
- [x] Round number displayed correctly

---

## A8 Review — 2026-02-13 (Backend)

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | Timed discussion behavior is orchestrated via state machine deadlines/scheduler and explicit `skipDiscussion` owner flow. |
| Acceptance criteria | ✅ | Real-time timer fields are server-authoritative, owner skip is enforced, and auto-advance to `publicVoting` is wired. |
| Error handling quality | ✅ | Clear phase/game/room ownership checks with descriptive errors. |
| Security posture | ✅ | Authenticated player membership and owner-only action for skip are enforced. |
| Edge-case coverage | ✅ | Stale timer firing is guarded with phase/token checks in timer handling. |
| Performance risks | ✅ | No heavy loops or unbounded operations in discussion handlers. |
| Code convention alignment | ✅ | Uses existing internal scheduler/state-machine patterns consistently. |
| Type safety | ✅ | Convex validators and typed IDs used throughout. |
| Cross-task compatibility | ✅ | Integrates cleanly with T03 phase engine and T09 voting entry conditions. |
| Deliverable completeness | ✅ | Backend timer, skip, and phase progression requirements are fully present. |

