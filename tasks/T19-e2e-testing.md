# T19 — End-to-End Testing & Test Scenarios

| Field | Value |
|-------|-------|
| **Agent** | A6 — QA & Security Agent |
| **Co-Agent** | A5 — Game Logic Designer |
| **Priority** | P1 |
| **Complexity** | L |
| **Dependencies** | T13, T15 |

## Description

Design and implement comprehensive E2E tests covering full game flows and edge cases.

## Sub-Tasks

### Test Infrastructure

1. Set up Playwright or Cypress for E2E testing
2. Configure multi-browser test runners (simulate multiple players)
3. Set up Convex test environment (isolated from production)
4. Create test utilities: `createTestRoom()`, `joinAsPlayer()`, `advanceToPhase()`

### Core Flow Tests

5. Full happy-path game: lobby → card deal → discussion → vote → abilities → mafia vote → resolution → win
6. Citizens win scenario: all mafia eliminated over multiple rounds
7. Mafia win scenario: mafia reaches parity
8. Boy revenge elimination flow
9. Girl protection blocks mafia kill

### Edge Case Tests

10. 3-player minimum game (1 mafia, 2 citizens)
11. 30-player maximum game
12. All optional roles disabled (only Mafia + Citizen)
13. Sheikh investigates mafia vs. citizen
14. Tie vote → no elimination
15. Owner disconnects mid-game → ownership transfer
16. Player reconnects before/after deadline
17. Phase timeout auto-advance (no player action)

### Security Tests

18. Attempt to vote as dead player (expect rejection)
19. Attempt to use ability as wrong role (expect rejection)
20. Inspect network responses for role leakage
21. Submit action during wrong phase (expect rejection)

### Performance Tests

22. Simulate 30-player room with rapid voting
23. Measure round-trip latency for vote mutations
24. Test real-time subscription updates under load

## Acceptance Criteria

- [ ] All core flow tests pass
- [ ] All edge case tests pass
- [ ] All security tests pass
- [ ] Performance tests show <500ms mutation latency
- [ ] Tests run in CI pipeline
- [ ] Test coverage report generated
