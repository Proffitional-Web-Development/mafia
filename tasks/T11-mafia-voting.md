# T11 — Mafia Voting Phase

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T10 |

## Description

Implement the private mafia voting phase where mafia members collectively choose a target to eliminate.

## Backend Sub-Tasks

1. `castMafiaVote` mutation:
   - Validate caller is alive Mafia member
   - Validate target is alive and NOT mafia
   - Store/update vote in `votes` table (phase: "mafia")
   - Allow vote changes before resolution
2. `getMafiaVotes` query (mafia-only): returns current mafia vote tally
3. Vote resolution:
   - Majority target is eliminated UNLESS protected by Girl
   - If protected: no elimination, protection is still secret
   - Tie: no elimination (or random — decide)
4. Auto-resolve on timeout
5. Record elimination (or protection block) in `gameEvents`

## Frontend Sub-Tasks

6. Mafia voting UI (mafia players only):
   - Player grid excluding mafia members
   - Vote indicators showing teammate votes
   - "Confirm" or auto-resolve timer
7. Non-mafia waiting screen: "The mafia is deciding..." (no info leakage)
8. Result announcement: "Player X was eliminated" or "No one was eliminated"
9. Subtle UI: no visual cues that protection was triggered (if protected, just "no elimination")

## Acceptance Criteria

- [ ] Only alive mafia members can vote
- [ ] Mafia cannot target other mafia
- [ ] Votes visible only to mafia members
- [ ] Protection blocks elimination silently
- [ ] Non-mafia players see no vote details
- [ ] Timeout auto-resolves voting

---

## A8 Review — 2026-02-13 (Backend)

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | `castMafiaVote`, `getMafiaVotes`, confirm/timeout resolution, and elimination/protection outcomes are correctly implemented. |
| Acceptance criteria | ✅ | Alive-mafia-only voting, mafia-target prohibition, mafia-only vote visibility, silent protection block, and timeout resolution are all present. |
| Error handling quality | ✅ | Clear guards for phase, membership, alive checks, target rules, and stale timer token mismatches. |
| Security posture | ✅ | Vote visibility is properly restricted to alive mafia users; non-mafia access is denied. |
| Edge-case coverage | ✅ | Tie/no-vote → no elimination; duplicate timer execution is prevented via prior-result and token checks. |
| Performance risks | ✅ | Vote tallying is linear and bounded by small mafia voter set. |
| Code convention alignment | ✅ | Resolution helper reuse and internal auto-resolve pattern align with T09 implementation style. |
| Type safety | ✅ | Strong Convex validators and typed payload parsing fallback behavior. |
| Cross-task compatibility | ✅ | Reads girl protection from T10 action records and transitions into T12 resolution. |
| Deliverable completeness | ✅ | Backend mafia voting deliverables are complete. |

