# T10 — Ability Phase (Sheikh & Girl)

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T09 |

## Description

Implement the night ability phase where Sheikh investigates and Girl protects.

## Backend Sub-Tasks

1. `useSheikhAbility` mutation:
   - Validate caller is alive Sheikh
   - Validate target is alive and not self
   - Store investigation in `actions` table
   - Return target's faction (Mafia/Citizen) ONLY to Sheikh
2. `useGirlAbility` mutation:
   - Validate caller is alive Girl
   - Validate target is alive (can be self? — decide)
   - Store protection in `actions` table
   - Protection is secret — no public reveal
3. Phase skip logic: if Sheikh is dead, skip investigation; if Girl is dead, skip protection
4. Timeout: auto-skip ability if not used within deadline (e.g., 30 seconds)
5. `getAbilityPhaseState` query:
   - Sheikh sees: player selection grid + past investigation results
   - Girl sees: player selection grid
   - Others see: "Night phase — abilities in progress" waiting screen

## Frontend Sub-Tasks

6. Sheikh UI: player selection grid with "Investigate" button, result reveal (Mafia/Citizen badge)
7. Girl UI: player selection grid with "Protect" button, confirmation message
8. Waiting screen for non-ability players: moon/night themed, subtle animation
9. Investigation history panel (Sheikh sees all past results privately)
10. Phase transition animation: night → mafia voting

## Acceptance Criteria

- [ ] Sheikh can investigate one player per round
- [ ] Sheikh sees correct role faction (never wrong)
- [ ] Girl can protect one player per round
- [ ] Protection is invisible to all other players
- [ ] Non-ability players see a waiting screen with no info leakage
- [ ] Phase auto-skips if relevant role holders are dead
- [ ] Timeout auto-advances to next phase
