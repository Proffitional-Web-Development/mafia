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

- [ ] All alive players can cast exactly one vote
- [ ] Votes are changeable before confirmation
- [ ] Vote tallies update in real-time for all players
- [ ] Owner confirms and resolves voting
- [ ] Tie results in no elimination
- [ ] Dead players cannot vote
- [ ] Elimination recorded and player marked as dead
