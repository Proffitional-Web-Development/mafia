# T13 — Win Condition Evaluation & Game End

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A5 — Game Logic Designer |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T12 |

## Description

Evaluate win conditions after every resolution and handle game-end flow.

## Backend Sub-Tasks

1. `checkWinCondition` internal function (called after every resolution):
   - Count alive mafia and alive citizens
   - Citizens win: all mafia eliminated (`aliveMafia === 0`)
   - Mafia win: `aliveMafia >= aliveCitizens`
   - No winner: continue to next round
2. `endGame` mutation:
   - Set game phase to "finished"
   - Record `winnerFaction` in games table
   - Reveal ALL roles to ALL players
   - Record game end in `gameEvents`
3. Update player stats (wins, losses, games played) in `users` table
4. If no winner: increment round counter, advance to Discussion phase

## Frontend Sub-Tasks

5. Game Over screen:
   - Winning faction announcement (with themed animation)
   - Full role reveal table (all players, their roles, alive/dead status)
   - Personal stats: "You were [Role] — Your team [Won/Lost]"
   - "Play Again" button (return to lobby with same room)
   - "Leave" button (return to home)
6. Role reveal animation: flip all hidden cards simultaneously
7. Post-game chat/reaction period (optional, P2)

## Acceptance Criteria

- [ ] Citizens win correctly when all mafia are dead
- [ ] Mafia win correctly when mafia ≥ citizens
- [ ] Win check runs after EVERY elimination (including Boy revenge)
- [ ] All roles revealed on game end
- [ ] Player stats updated
- [ ] "Play Again" resets room to lobby state
- [ ] Game cannot continue after win condition met
