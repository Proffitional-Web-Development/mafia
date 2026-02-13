# T15 — Security & Anti-Cheat Measures

| Field | Value |
|-------|-------|
| **Agent** | A6 — QA & Security Agent |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T03, T07, T09, T10, T11 |

## Description

Audit and harden all game systems against cheating, role leakage, and unauthorized actions.

## Sub-Tasks

### Data Isolation

1. Audit every Convex query to ensure role data is scoped per player
2. Verify mafia teammate list only visible to mafia
3. Verify Sheikh investigation results only visible to Sheikh
4. Verify Girl protection target not visible to anyone else
5. Ensure eliminated player's role is NOT revealed until game end

### Action Validation

6. Verify all mutations check: player is alive, correct phase, correct role, valid target
7. Prevent double voting (same phase, same round)
8. Enforce action deadlines server-side (no late submissions after phase advance)
9. Validate room owner actions (only owner can start game, confirm votes, etc.)

### Client Security

10. Ensure no game logic runs on the client (all outcomes computed server-side)
11. Strip sensitive fields from all query responses (no raw role data in API responses)
12. Add rate limiting on mutations (prevent spam votes, rapid room creation)
13. Review browser DevTools: ensure no role info in network tab or React state

### Race Conditions

14. Test concurrent vote submissions (two players vote at exact same time)
15. Test phase transition during active mutation (vote submitted as phase advances)
16. Ensure optimistic updates don't leak state

## Acceptance Criteria

- [ ] No role information accessible via DevTools (network, React state, console)
- [ ] All mutations reject invalid callers, phases, and targets
- [ ] Concurrent operations handled without data corruption
- [ ] Rate limiting prevents spam
- [ ] Full security audit checklist completed and signed off
