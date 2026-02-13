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

---

## A8 Review — 2026-02-13 (Backend)

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | `useSheikhAbility`, `useGirlAbility`, and `getAbilityPhaseState` satisfy role-restricted action flow and per-round limits. |
| Acceptance criteria | ✅ | One action per role holder per round, correct sheikh faction result, private protection behavior, waiting state for others, dead-role skip logic, and timeout progression are implemented. |
| Error handling quality | ✅ | Strong checks for phase, role, alive status, target validity, and duplicate-use prevention. |
| Security posture | ✅ | Ability execution is strictly tied to authenticated player identity and role; non-ability players receive no sensitive action details. |
| Edge-case coverage | ✅ | Handles missing/dead sheikh/girl and completes phase when required actions are done or timer expires. |
| Performance risks | 🟢 | `getAbilityPhaseState` performs full-round action/history scans; acceptable for room sizes in scope. |
| Code convention alignment | ✅ | Helper-driven structure and event logging are consistent with backend architecture. |
| Type safety | ✅ | Typed IDs and explicit Convex validators are applied across all handlers. |
| Cross-task compatibility | ✅ | Uses T03 timer/token guards and hands off correctly into T11 mafia voting. |
| Deliverable completeness | ✅ | Backend requirements for ability phase are complete. |

