# T06 — Room System (Create, Join, Configure)

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T02, T04 |

## Description

Implement the full room lifecycle: creation, joining, configuration, and transition to game start.

## Backend Sub-Tasks

1. `createRoom` mutation: generates unique room code (6-char alphanumeric), sets creator as owner
2. `joinRoom` mutation: validates room code, checks capacity, adds player to room
3. `updateRoomSettings` mutation (owner-only): discussion duration, max players, enabled roles
4. `kickPlayer` mutation (owner-only): remove a player from the room
5. `startGame` mutation (owner-only): validates minimum player count (3), triggers card distribution
6. `leaveRoom` mutation: player exits, transfer ownership if owner leaves
7. `getRoomState` query: real-time room data (players list, settings, owner indicator)
8. Generate shareable invite link containing room code
9. Room auto-cleanup: delete rooms inactive for 30+ minutes (Convex cron)

## Frontend Sub-Tasks

10. Create Room page: button to create, input to join by code
11. Lobby page: player list with avatars, settings panel (owner-only), start button
12. Real-time player join/leave animations
13. Copy invite link button
14. Settings form: sliders/inputs for discussion time, player count, role toggles
15. Responsive lobby layout for mobile

## Acceptance Criteria

- [x] Room created with unique code
- [ ] Players join via code or link
- [x] Owner can configure all settings from GDD
- [x] Non-owners see settings as read-only
- [x] Start button validates minimum players
- [x] Real-time updates when players join/leave
- [x] Owner transfer works on owner disconnect

---

## A8 Review — 2026-02-13 (Backend)

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | `createRoom`, `joinRoom`, `updateRoomSettings`, `kickPlayer`, `leaveRoom`, `startGame`, and `getRoomState` are implemented with expected guards and data writes. |
| Acceptance criteria | ✅ | Backend supports unique codes, join by code (and link-compatible flow via code lookup), owner-only settings, min-player start validation, real-time query model, and ownership transfer. |
| Error handling quality | ✅ | Descriptive `ConvexError` checks exist for room-not-found, full-room, invalid owner actions, invalid settings, and invalid phase/state actions. |
| Security posture | ✅ | Auth is required for room mutations; owner-only guards are correctly enforced for privileged actions. |
| Edge-case coverage | ✅ | Owner leave transfer and empty-room finish behavior are handled; idempotent re-join behavior exists. |
| Performance risks | 🟢 | Cleanup batch currently `take(50)` per cron run; acceptable for MVP and avoids unbounded work. |
| Code convention alignment | ✅ | Helpers are clear and consistent with existing Convex patterns. |
| Type safety | ✅ | Strong Convex validators and typed IDs are used across room operations. |
| Cross-task compatibility | ✅ | `startGame` correctly creates `games`/`players` records for T07+ flow and schedules card distribution. |
| Deliverable completeness | ✅ | Required backend room lifecycle and stale-room cleanup are present. |

### Findings

- 🟢 Minor: Room code generation uses `Math.random()` rather than cryptographic randomness; acceptable for non-secret invite codes in MVP, but consider aligning with secure RNG approach used in card distribution.

