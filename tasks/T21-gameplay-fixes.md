# T21 — Gameplay Fixes & Enhancements

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | XL |
| **Dependencies** | T06, T09, T10, T11, T12 |

## Description

Fix critical gameplay bugs and implement missing features across ability phases, voting phases, player logs, voting transparency, and the room browsing system. This task covers eight issues identified during QA testing.

---

## Issue 1 — Sheikh Phase Flow (Confirm Before Advance)

**Problem:** The Sheikh ability phase transitions directly to the Mafia voting phase before the Sheikh player can view the investigation result. The `maybeCompleteAbilityPhase()` helper in `abilityPhase.ts` immediately sets `phaseDeadlineAt = Date.now()` and schedules `handlePhaseTimer` as soon as the action is recorded.

**Requirement:** All ability phases (Sheikh, Girl) must include an explicit **Confirm** action from the acting player before the system progresses to the next phase.

### Backend Sub-Tasks

1. Add a `confirmAbilityAction` mutation in `abilityPhase.ts` that:
   - Requires the acting player (sheikh/girl) to call after viewing the result
   - Validates the player has already submitted their ability action for the current round
   - Marks the action as confirmed (add `confirmed: v.optional(v.boolean())` field to the `actions` table)
   - Only after confirmation, triggers `maybeCompleteAbilityPhase()`
2. Refactor `maybeCompleteAbilityPhase()` to check that all submitted actions have `confirmed === true` (not just that they exist) before advancing
3. Ensure the ability phase timer (`ABILITY_PHASE_MS`) acts as a hard deadline — if the player doesn't confirm within the timer, auto-resolve still advances the phase
4. Remove the immediate `maybeCompleteAbilityPhase()` call from `useSheikhAbility` and `useGirlAbility` — these should only record the action, not trigger phase completion

### Frontend Sub-Tasks

5. Add a **"Confirm"** button to the Sheikh ability result screen that calls `confirmAbilityAction` after the player views the investigation faction result
6. Add a **"Confirm"** button to the Girl ability screen that calls `confirmAbilityAction` after the player sees the protection acknowledgment
7. Disable/hide the Confirm button until the action has been submitted; show it only on the result view

---

## Issue 2 — Ability Phase Timing (Post-Elimination)

**Problem:** Ability phases must begin only after the public voting phase completes **and** the voted player is eliminated (or a no-elimination result is resolved).

**Requirement:** The ability phase transition must be gated on the public voting result being fully processed.

### Backend Sub-Tasks

8. In `stateMachine.ts`, verify that `advancePhaseInternal` from `publicVoting → abilityPhase` only executes after `resolvePublicVoting()` has written the `public_elimination` or `no_elimination` game event
9. Add a guard in the `abilityPhase` entry logic (in `handlePhaseTimer` or the phase transition) that checks for the existence of a voting result event for the current round before starting ability-phase timers
10. Add integration tests verifying the phase ordering: `publicVoting` → elimination applied → `abilityPhase` starts

---

## Issue 3 — Tie Handling: Public Voting (Runoff)

**Problem:** When two or more players receive equal highest votes, the current code sets `noElimination = true` and skips elimination entirely. The required behavior is a runoff vote among only the tied candidates.

**Requirement:** On a tie, reset votes and start a new voting round restricted to only the tied players.

### Backend Sub-Tasks

11. Add a `votingSubRound` field to the `games` table (`v.optional(v.number())`, defaults to `0`) to track runoff rounds within a single game round
12. Add a `tiedCandidates` field to the `games` table (`v.optional(v.array(v.id("players")))`) to store the set of valid targets during a runoff
13. Modify `resolvePublicVoting()` in `publicVoting.ts`:
    - On tie: instead of setting `noElimination = true`, write a `public_vote_tie` game event, clear existing votes for that round/phase, set `tiedCandidates` on the game, increment `votingSubRound`, and reset the phase deadline timer
    - On non-tie or if `votingSubRound > 0` and still tied: fall through to no-elimination (prevent infinite runoffs — max 1 runoff)
14. Modify `castPublicVote` to validate that if `tiedCandidates` is set on the game, the target must be in the tied candidates list
15. Add `getPublicVotingRunoffState` query returning `{ isRunoff: boolean, tiedCandidates: PlayerInfo[], subRound: number }`

### Frontend Sub-Tasks

16. Show a runoff UI when `isRunoff === true`: display only the tied candidates as selectable vote targets, with a banner indicating "Runoff Vote — Choose between tied players"
17. If the runoff also results in a tie, show "No elimination — votes tied" and advance

---

## Issue 4 — Tie Handling: Mafia Voting (Random Selection)

**Problem:** When Mafia votes are tied between multiple targets, the current code sets `noElimination = true`. The required behavior is to randomly eliminate one of the tied targets.

**Requirement:** On a Mafia vote tie, the system randomly selects one of the tied players for elimination.

### Backend Sub-Tasks

18. Modify `resolveMafiaVoting()` in `mafiaVoting.ts`:
    - When `top.length > 1`, instead of `noElimination = true`, randomly select one tied player (`top[Math.floor(Math.random() * top.length)]`) as the elimination target
    - Still check girl protection after random selection
    - Record the randomization in the `mafia_vote_result` event payload (add `wasRandomTieBreak: true`, `tiedPlayerIds: string[]`)
19. Update the `mafia_vote_result` event type documentation to include the new payload fields

### Frontend Sub-Tasks

20. In the Mafia voting result display, if `wasRandomTieBreak === true`, show an indicator that the elimination was decided by random selection among tied players

---

## Issue 5 — Sheikh Investigation Logs

**Problem:** The Sheikh has no persistent view of past investigation results. The data exists in the `actions` table but is only partially exposed via `getAbilityPhaseState` during the active ability phase.

**Requirement:** The Sheikh must have access to a private investigation log accessible at any time during the game.

### Backend Sub-Tasks

21. Create a `getSheikhInvestigationLog` query in `abilityPhase.ts`:
    - Requires authenticated user
    - Verifies the player is the Sheikh in the specified game
    - Queries all `actions` where `role === "sheikh"` and `actorId === me._id` for the game
    - Returns array of `{ round, targetPlayerId, targetUsername, targetAvatarUrl, faction: "mafia" | "citizens", timestamp }`
    - Accessible regardless of current game phase (not just during `abilityPhase`)

### Frontend Sub-Tasks

22. Create a `SheikhLogPanel` component showing a scrollable list of past investigations with:
    - Round number
    - Target player name and avatar
    - Result badge (Mafia / Citizens) with color coding (red / green)
    - Timestamp
23. Show a persistent "Investigation Log" icon/button in the Sheikh's game HUD that opens the log panel as a slide-over or modal
24. Ensure the log is only visible to the Sheikh player (not other roles)

---

## Issue 6 — Girl Protection Logs

**Problem:** The Girl has no persistent view of past protection actions. Similar to the Sheikh, the data exists in the `actions` table but isn't exposed outside the ability phase.

**Requirement:** The Girl must have access to a private protection log accessible at any time during the game.

### Backend Sub-Tasks

25. Create a `getGirlProtectionLog` query in `abilityPhase.ts`:
    - Requires authenticated user
    - Verifies the player is the Girl in the specified game
    - Queries all `actions` where `role === "girl"` and `actorId === me._id` for the game
    - Cross-references with `mafia_vote_result` events to determine protection outcome:
      - `"successful"` — the girl's target matched the Mafia's elimination target (`protectionBlocked === true`)
      - `"not_used"` — the girl's target was not attacked by Mafia
    - Returns array of `{ round, targetPlayerId, targetUsername, targetAvatarUrl, outcome: "successful" | "not_used", timestamp }`

### Frontend Sub-Tasks

26. Create a `GirlLogPanel` component showing a scrollable list of past protections with:
    - Round number
    - Target player name and avatar
    - Outcome badge (Successful Protection / Not Used) with color coding
    - Timestamp
27. Show a persistent "Protection Log" icon/button in the Girl's game HUD that opens the log panel as a slide-over or modal
28. Ensure the log is only visible to the Girl player (not other roles)

---

## Issue 7 — Voting Transparency (Real-Time Voter Visibility)

**Problem:** During the public voting phase, players cannot see who is currently voting for them in real time.

**Requirement:** Each player must see which players are voting for them, updated in real time.

### Backend Sub-Tasks

29. Extend the `getPublicVotes` query in `publicVoting.ts` to include a `votesAgainstMe` field:
    - Filters votes where `targetId === me._id`
    - Returns list of `{ voterId, voterPlayerId, voterUsername, voterAvatarUrl }` for each voter targeting the current player
30. Ensure the query remains reactive (Convex queries are reactive by default when subscribed)

### Frontend Sub-Tasks

31. Add a "Votes against you" section to the public voting screen showing:
    - Count badge (e.g., "3 votes against you")
    - Avatars/names of players currently voting for the user
    - Real-time updates as votes change
32. Add subtle animation when a new voter targets or un-targets the current player

---

## Issue 8 — Active Rooms Listing (Public/Private Rooms)

**Problem:** Players cannot browse active rooms. All rooms require a code to join. Room owners have no way to mark a room as public.

**Requirement:** Display a list of joinable active rooms. Owners can create public or private (password-protected) rooms.

### Schema Changes

33. Add fields to the `rooms` table in `schema.ts`:
    - `visibility: v.union(v.literal("public"), v.literal("private"))` — room access type
    - `password: v.optional(v.string())` — hashed password for private rooms
34. Add a `by_status_visibility` compound index on `["status", "visibility"]` for efficient public room queries

### Backend Sub-Tasks

35. Modify `createRoom` mutation in `rooms.ts`:
    - Accept optional `visibility` argument (default: `"private"` for backward compatibility)
    - Accept optional `password` argument (required when `visibility === "private"` and the owner wants password protection; otherwise the room is code-only)
    - Hash the password before storing (use a simple hash utility or Convex-compatible approach)
36. Create `listActiveRooms` query in `rooms.ts`:
    - Returns all rooms where `status === "waiting"`
    - For each room, include: `roomId`, `code`, `ownerUsername`, `ownerAvatarUrl`, `playerCount`, `maxPlayers`, `visibility`, `createdAt`
    - Public rooms are fully visible; private rooms appear in the list but require password/code to join
    - Paginate results (e.g., 20 per page) or use Convex `.take(50)`
37. Modify `joinRoom` mutation:
    - If the room is private and has a password, require a `password` argument and validate it
    - If the room is public, allow joining without a code (accept `roomId` as an alternative to `code`)
38. Add `updateRoomVisibility` mutation (owner-only): allows toggling between public/private and setting/changing password

### Frontend Sub-Tasks

39. Add a **"Browse Rooms"** tab/section to the game lobby page alongside Create/Join:
    - List of active public rooms with owner info, player count, and a "Join" button
    - Private rooms shown with a lock icon; clicking "Join" prompts for password
    - Empty state: "No active rooms — create one!"
40. Update the **Create Room** flow:
    - Add a toggle: "Public Room" / "Private Room"
    - When "Private" is selected, show an optional password input
    - Default to "Private" for backward compatibility
41. Add real-time updates to the room list (Convex subscription on `listActiveRooms`)
42. Add a filter/search bar for room list (filter by owner name or room code)

---

## Acceptance Criteria

- [ ] Sheikh sees investigation result and must press Confirm before phase advances
- [ ] Girl sees protection acknowledgment and must press Confirm before phase advances
- [ ] Ability phase timer still auto-advances if player doesn't confirm in time
- [ ] Ability phase starts only after public voting elimination is fully resolved
- [ ] Public voting tie triggers a runoff vote among only the tied candidates
- [ ] Runoff tie (second tie) results in no elimination
- [ ] Mafia voting tie randomly eliminates one of the tied players
- [ ] Sheikh can view investigation log at any point during the game
- [ ] Girl can view protection log with outcomes at any point during the game
- [ ] During public voting, each player sees who is voting for them in real time
- [ ] Players can browse a list of active public rooms
- [ ] Room owners can create public or private (password-protected) rooms
- [ ] Private rooms require password to join; public rooms allow direct join
- [ ] All new i18n keys added for EN and AR locales
- [ ] No regressions in existing game flow (discussion → voting → abilities → mafia → resolution)
