# T12 — Resolution Phase & Boy Ability

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A5 — Game Logic Designer |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T11 |

## Description

Apply all eliminations from the round and handle the Boy's revenge ability.

## Backend Sub-Tasks

1. `resolveRound` internal mutation:
   - Mark eliminated players as dead (`isAlive: false`, `eliminatedAtRound`)
   - Check if eliminated player is a Boy
2. Boy revenge trigger:
   - If Boy was eliminated (by public vote OR mafia), trigger immediate extra elimination
   - `useBoyRevenge` mutation: Boy selects one alive player to eliminate
   - Timeout: if Boy doesn't choose within deadline, revenge is forfeited
3. Apply Boy's revenge elimination
4. Log all eliminations in `gameEvents` with cause (publicVote / mafia / boyRevenge)
5. Broadcast resolution results to all players

## Frontend Sub-Tasks

6. Resolution announcement screen:
   - Show who was eliminated this round (with dramatic reveal)
   - If Boy eliminated: special prompt for Boy to choose revenge target
   - Boy target selection UI (time-limited)
7. Revenge result: "Player X was also eliminated by the Boy's ability"
8. Updated alive/dead player list
9. Transition animation to next phase (discussion or endCheck)

## Acceptance Criteria

- [ ] Eliminated players marked dead correctly
- [ ] Boy revenge triggers only when Boy is eliminated
- [ ] Boy has time-limited window to choose target
- [ ] Forfeited revenge results in no extra elimination
- [ ] Multiple eliminations in one round handled correctly
- [ ] All eliminations logged with correct cause
