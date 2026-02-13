# T16 — Reconnection & Disconnect Handling

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T03, T09 |

## Description

Handle player disconnections and reconnections gracefully per GDD rules.

## Backend Sub-Tasks

1. Track player connection status (`isConnected` in players table)
2. Detect disconnection via Convex presence or heartbeat mechanism
3. Reconnection logic:
   - Before voting deadline: player resumes normally, full state restored
   - After voting deadline: player is auto-eliminated
4. Owner disconnect: transfer ownership to next player in join order
5. Handle mass disconnect scenario (if all players disconnect, pause game or auto-end)
6. Grace period: 30-second window before marking as disconnected
7. `reconnectPlayer` mutation: restore player state and sync current phase

## Frontend Sub-Tasks

8. Connection status indicator (green dot / red dot on player avatars)
9. Reconnection overlay: "Reconnecting..." with auto-retry
10. State rehydration on reconnect: fetch current game phase and render correct UI
11. Toast notification: "Player X disconnected" / "Player X reconnected"
12. Handle browser tab close vs. temporary network loss differently

## Acceptance Criteria

- [ ] Player reconnecting before deadline continues normally
- [ ] Player reconnecting after deadline is eliminated
- [ ] Owner disconnect transfers ownership
- [ ] Connection indicators visible to all players
- [ ] Reconnect restores full game state (phase, votes, role)
- [ ] Grace period prevents false disconnections
