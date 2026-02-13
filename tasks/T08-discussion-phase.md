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

- [ ] Timer counts down accurately in real-time
- [ ] Timer synced across all clients (server-authoritative)
- [ ] Phase auto-advances when timer hits zero
- [ ] Owner can end discussion early
- [ ] Dead players see "spectating" state
- [ ] Round number displayed correctly
