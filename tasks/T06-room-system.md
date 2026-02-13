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

- [ ] Room created with unique code
- [ ] Players join via code or link
- [ ] Owner can configure all settings from GDD
- [ ] Non-owners see settings as read-only
- [ ] Start button validates minimum players
- [ ] Real-time updates when players join/leave
- [ ] Owner transfer works on owner disconnect
