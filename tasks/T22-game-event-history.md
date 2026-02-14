# T22 — Meme-Style Game Event History System

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | XL |
| **Dependencies** | T02, T03, T05, T09, T10, T11, T12 |

## Description

Implement a shared game event history system that displays meme-style messages for key game events, visible to all players in real time. The system supports multiple tone levels (Normal, Fun, Chaos), i18n for English and Arabic, and randomized message template selection per event.

---

## Issue 1 — Event Schema & Model

**Problem:** There is no unified game event log that all players can see. Events are scattered across phase-specific logic and not stored in a player-visible format.

**Requirement:** Define a centralized event schema that captures all public game events with resolved messages, round context, and timestamps.

### Schema Changes

1. Add a `gameEvents` table to `schema.ts` with fields:
   - `gameId: v.id("games")` — reference to the game
   - `eventType: v.union(v.literal("VOTE_ELIMINATION"), v.literal("MAFIA_ELIMINATION"), v.literal("MAFIA_FAILED_ELIMINATION"), v.literal("SHEIKH_INVESTIGATION_CITIZEN"), v.literal("SHEIKH_INVESTIGATION_MAFIA"), v.literal("ROUND_END"), v.literal("VOTE_TIE"), v.literal("MAFIA_VOTE_TIE_RANDOM"))` — event category
   - `resolvedMessage: v.string()` — the final meme message with placeholders filled in (message key, not raw text)
   - `messageKey: v.string()` — the i18n key used (e.g. `"events.VOTE_ELIMINATION.fun.2"`)
   - `messageParams: v.optional(v.any())` — placeholder values (e.g. `{ player: "Ahmed" }`)
   - `round: v.number()` — game round number
   - `timestamp: v.number()` — `Date.now()` when the event occurred
   - `memeLevel: v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS"))` — tone used when generating the message
2. Add indexes on the `gameEvents` table:
   - `by_gameId` on `["gameId"]` for fetching all events for a game
   - `by_gameId_round` on `["gameId", "round"]` for round-specific queries

---

## Issue 2 — Meme Level Room Setting

**Problem:** There is no room-level setting to control the tone of game event messages.

**Requirement:** Each room must have a configurable meme level that determines which message templates are used.

### Schema Changes

3. Add a `memeLevel` field to the `rooms` table in `schema.ts`:
   - `memeLevel: v.optional(v.union(v.literal("NORMAL"), v.literal("FUN"), v.literal("CHAOS")))` — defaults to `"FUN"` when not set

### Backend Sub-Tasks

4. Modify `createRoom` mutation in `rooms.ts`:
   - Accept optional `memeLevel` argument (default: `"FUN"`)
   - Store the value on the room document
5. Create `updateMemeLevel` mutation (owner-only):
   - Validates caller is the room owner
   - Updates the `memeLevel` field on the room
   - Only allowed while room status is `"waiting"` (before game starts)
6. Expose `memeLevel` in the `getRoomState` query response so the frontend can display the current setting

### Frontend Sub-Tasks

7. Add a **Meme Level** selector to the room creation flow:
   - Three options: "Normal", "Fun" (default, highlighted), "Chaos"
   - Short description for each level (e.g. Normal: "Just the facts", Fun: "Light humor", Chaos: "Full meme mode")
8. Add a **Meme Level** display/selector in the room lobby settings (owner-only, editable before game starts)
9. Show the current meme level as a badge in the game UI header

---

## Issue 3 — Message Template Registry

**Problem:** No message templates exist for game events.

**Requirement:** Define a structured set of i18n message templates for each event type and meme level, with placeholder support.

### Backend Sub-Tasks

10. Create a `gameEventTemplates.ts` utility file containing:
    - A registry mapping `(eventType, memeLevel) → messageKey[]`
    - Each entry is a list of i18n message keys for that combination
    - Example structure:
      ```ts
      const TEMPLATES = {
        VOTE_ELIMINATION: {
          NORMAL: ["events.VOTE_ELIMINATION.normal.1", "events.VOTE_ELIMINATION.normal.2"],
          FUN: ["events.VOTE_ELIMINATION.fun.1", "events.VOTE_ELIMINATION.fun.2", "events.VOTE_ELIMINATION.fun.3"],
          CHAOS: ["events.VOTE_ELIMINATION.chaos.1", "events.VOTE_ELIMINATION.chaos.2", "events.VOTE_ELIMINATION.chaos.3"],
        },
        // ... for each event type
      }
      ```
    - A `pickRandomTemplate(eventType, memeLevel)` function that returns a random `messageKey` from the matching list
11. Define placeholder contracts per event type:
    - `VOTE_ELIMINATION` → `{ player: string }`
    - `MAFIA_ELIMINATION` → `{ player: string }`
    - `MAFIA_FAILED_ELIMINATION` → `{ player: string }`
    - `SHEIKH_INVESTIGATION_CITIZEN` → `{ player: string }` (no faction leak — message says "investigated" not "is citizen")
    - `SHEIKH_INVESTIGATION_MAFIA` → `{ player: string }` (no faction leak — message says "investigated" not "is mafia")
    - `ROUND_END` → `{ round: number }`
    - `VOTE_TIE` → `{ players: string }` (comma-separated names)
    - `MAFIA_VOTE_TIE_RANDOM` → `{ player: string }`

### i18n Sub-Tasks

12. Add English message templates to `messages/en.json` under an `events` namespace:
    - At least 2 templates per event type for `NORMAL`
    - At least 3 templates per event type for `FUN`
    - At least 3 templates per event type for `CHAOS`
    - All templates must be dramatic, sarcastic, or playful — never offensive
    - Example keys:
      ```json
      {
        "events": {
          "VOTE_ELIMINATION": {
            "normal": { "1": "{player} has been eliminated by vote.", "2": "The village voted. {player} is out." },
            "fun": { "1": "🗳️ Democracy strikes again. {player} didn't survive the ballot.", "2": "📢 The people have spoken — {player} has left the chat.", "3": "🪦 RIP {player}. Voted off the island." },
            "chaos": { "1": "🗳️💀 {player} just got ratio'd IRL. Democracy is brutal.", "2": "👋 {player} tried to blend in. The village said NOPE.", "3": "🫡 {player} has been democratically unalived. GG." }
          }
        }
      }
      ```
13. Add Arabic message templates to `messages/ar.json` under the same `events` namespace:
    - Same structure and key count as English
    - Maintain the same tone per meme level
    - Ensure placeholders work correctly with RTL text

---

## Issue 4 — Event Logging & Broadcasting

**Problem:** Game events are not logged to a shared, player-visible store.

**Requirement:** At each key game moment, create a `gameEvents` record with a randomly selected message template, resolved with the correct placeholders.

### Backend Sub-Tasks

14. Create a `logGameEvent` internal helper function in a `gameEvents.ts` convex file:
    - Accepts `{ ctx, gameId, eventType, params }` where `params` matches the placeholder contract for the event type
    - Looks up the room's `memeLevel` (from the game → room reference)
    - Calls `pickRandomTemplate(eventType, memeLevel)` to get a message key
    - Inserts a `gameEvents` record with `messageKey`, `messageParams`, `round`, `timestamp`, and `memeLevel`
    - This is an internal mutation helper (not a public mutation)
15. Integrate `logGameEvent` calls into existing phase resolution logic:
    - In `publicVoting.ts` → `resolvePublicVoting()`: log `VOTE_ELIMINATION` when a player is eliminated, or `VOTE_TIE` on a tie
    - In `mafiaVoting.ts` → `resolveMafiaVoting()`: log `MAFIA_ELIMINATION` on kill, `MAFIA_FAILED_ELIMINATION` when girl protection blocks the kill, `MAFIA_VOTE_TIE_RANDOM` on random tie-break
    - In `abilityPhase.ts` → `useSheikhAbility`: log `SHEIKH_INVESTIGATION_CITIZEN` or `SHEIKH_INVESTIGATION_MAFIA` (message must NOT reveal the faction — just say the Sheikh investigated someone)
    - In `stateMachine.ts` → round advancement: log `ROUND_END` at the end of each round
16. Create a `getGameEvents` query in `gameEvents.ts`:
    - Accepts `gameId`
    - Returns all `gameEvents` for the game, ordered by `timestamp` descending
    - Requires authenticated user who is a player in the game
    - Returns `{ eventType, messageKey, messageParams, round, timestamp }`

---

## Issue 5 — Visibility & Security

**Problem:** Event messages must not leak private role information.

**Requirement:** All event messages are public-safe. Sheikh investigation events say "investigated" without revealing the result. Girl protection events say "protection was used" without naming the Girl.

### Backend Sub-Tasks

17. Audit all `SHEIKH_INVESTIGATION_*` templates to ensure they do NOT include the investigation result (faction) in the public message:
    - Valid: "The Sheikh has conducted an investigation this round."
    - Invalid: "The Sheikh investigated {player} and found they are Mafia."
    - The `SHEIKH_INVESTIGATION_CITIZEN` and `SHEIKH_INVESTIGATION_MAFIA` event types are stored for internal analytics but the public `messageKey` must be faction-neutral
18. Audit all `MAFIA_FAILED_ELIMINATION` templates to ensure they do NOT name the Girl:
    - Valid: "The Mafia tried to strike but their target was protected!"
    - Invalid: "The Girl protected {player} from the Mafia."
19. Add a validation step in `logGameEvent` that checks the resolved message does not contain role names (Sheikh, Girl) in faction-revealing contexts — log a warning server-side if detected

---

## Issue 6 — Event History UI Component

**Problem:** No UI exists for displaying game event history.

**Requirement:** Display a scrollable timeline of game events visible to all players, with emoji, player name highlighting, and real-time updates.

### Frontend Sub-Tasks

20. Create a `GameEventTimeline` component in `components/game/game-event-timeline.tsx`:
    - Subscribes to `getGameEvents` query for the current game
    - Renders events in a scrollable list (newest at top)
    - Each event row shows:
      - Round number badge
      - The resolved message (rendered using `t(messageKey, messageParams)` for i18n)
      - Relative timestamp (e.g. "2m ago")
    - Empty state: "No events yet — the game is just getting started!"
21. Style the timeline:
    - Use the existing frosted glass card style (`border border-white/10 bg-white/5 backdrop-blur-md`)
    - Max height with overflow scroll (`max-h-64 overflow-y-auto`)
    - Each event row separated by subtle dividers
    - Player names in event messages should be bold/highlighted
22. Add the `GameEventTimeline` component to the main game layout:
    - Show as a collapsible panel or tab accessible from any game phase
    - Add a "Game Log" icon button in the game header that toggles the timeline
    - Badge the icon with the number of unread events (events since the player last opened the log)
23. Ensure RTL support:
    - Timeline layout must flip correctly for Arabic
    - Emoji placement should remain consistent
    - Player names render in the correct direction within mixed-direction text

---

## Issue 7 — Localization Integration

**Problem:** Event messages need full i18n support for English and Arabic.

**Requirement:** All event messages use i18n keys with placeholder interpolation, supporting both LTR and RTL layouts.

### Frontend Sub-Tasks

24. Ensure the `GameEventTimeline` component uses `useTranslations("events")` to resolve message keys
25. Verify that `messageParams` placeholders (e.g. `{ player: "Ahmed" }`) interpolate correctly in both EN and AR templates
26. Add i18n keys for timeline UI chrome:
    - `"events.timeline.title"` → "Game Log" / "سجل اللعبة"
    - `"events.timeline.empty"` → "No events yet" / "لا أحداث بعد"
    - `"events.timeline.round"` → "Round {round}" / "الجولة {round}"

---

## Acceptance Criteria

- [x] `gameEvents` table exists with correct schema and indexes
- [x] Rooms have a `memeLevel` field defaulting to `"FUN"`
- [x] Room owner can set meme level during room creation and in the lobby
- [x] At least 2 NORMAL, 3 FUN, and 3 CHAOS templates exist per event type in both EN and AR
- [x] `logGameEvent` is called at every relevant phase resolution point
- [x] Events appear in correct chronological order in the timeline
- [x] Messages vary per occurrence (random template selection)
- [x] Meme level changes the output tone of new events
- [x] No role or faction information leaks through public event messages
- [x] Timeline works in both English and Arabic with correct RTL layout
- [x] Real-time updates — new events appear without page refresh
- [x] Timeline is accessible from any game phase via a persistent toggle
- [x] Mobile-friendly scrollable layout
- [x] No regressions in existing game flow (discussion → voting → abilities → mafia → resolution)

---

❌ Review: REVISION REQUIRED

Backend audit result for T22 is **not approved**.

### Findings

- 🔴 Critical — **Schema compatibility regression in resolution flow**
  - `resolution.ts` still reads/writes legacy `gameEvents` fields (`type`, `payload`) while `schema.ts` now defines `eventType`, `messageKey`, `resolvedMessage`, `messageParams`, `memeLevel`.
  - This creates cross-task incompatibility and risks runtime failures during resolution, violating “No regressions in existing game flow”.

- 🔴 Critical — **Private investigation result can leak publicly via `messageKey`**
  - `abilityPhase.ts` logs distinct event types (`SHEIKH_INVESTIGATION_CITIZEN` vs `SHEIKH_INVESTIGATION_MAFIA`).
  - `gameEvents.ts` returns `messageKey` directly to all players; keys are faction-specific (`events.SHEIKH_INVESTIGATION_*`), so faction can be inferred even if `eventType` is masked.

- 🟡 Major — **Security validation step (Issue 5.19) is not implemented**
  - `logGameEvent` contains comments but no actual validation/warning logic for faction-revealing or role-revealing message content.

- 🟡 Major — **Mafia tie-break event logging is incomplete**
  - `MAFIA_VOTE_TIE_RANDOM` is logged only on successful elimination branch.
  - When a random tie-break occurs but kill is blocked by protection, tie-break event is not logged, so requirement coverage is incomplete.

- 🟡 Major — **Placeholder contracts are not type-safe**
  - `params` in `logGameEvent` is typed as `any`; no compile-time contract mapping per event type.
  - This allows invalid payload shapes and weakens backend correctness guarantees.

- 🟢 Minor — **Error handling consistency**
  - `getGameEvents` throws generic `Error` instead of `ConvexError`, reducing consistency of API error semantics.

## Revision Required

Reassign to **A1 — Backend Architect**.

1. Refactor `resolution.ts` to use the new `gameEvents` contract end-to-end (`eventType` + structured `messageParams`) and remove legacy `type/payload` assumptions.
2. Eliminate Sheikh-result leakage by making public `messageKey` faction-neutral (single public key family) while keeping internal analytics signal private.
3. Implement concrete server-side validation in `logGameEvent` for forbidden revealing phrases/role leaks and emit warnings when detected.
4. Ensure `MAFIA_VOTE_TIE_RANDOM` is logged whenever random tie-break selection occurs, regardless of subsequent protection outcome.
5. Replace `params: any` with strict event-type-to-params typing, and enforce at callsites.
6. Normalize query errors to `ConvexError` where user-facing authorization/validation errors are thrown.

---

✅ Re-review: PASSED (Backend)

All previously reported backend reviewer issues were addressed and validated:
- `gameEvents` legacy contract usage removed from resolution/card distribution flows.
- Public Sheikh event output is faction-neutral in returned `messageKey`/`eventType` shape.
- `logGameEvent` now includes typed event-param contracts and server-side leak-warning checks.
- `MAFIA_VOTE_TIE_RANDOM` logging now covers tie-breaks regardless of protection outcome.
- Authz error handling in `getGameEvents` now uses `ConvexError`.

---

✅ Re-review: PASSED (Frontend)

Frontend completion validated:
- `GameEventTimeline` implemented with real-time subscription, round badges, relative timestamps, empty state, and highlighted player names.
- Persistent `Game Log` header toggle added with unread badge and collapsible timeline panel across game phases.
- Meme level selector wired in room creation and owner-only lobby settings; current meme level badge shown in game header.
- EN/AR `events` + timeline chrome keys added and integrated via `useTranslations("events")`.
- RTL/mixed-direction rendering handled in timeline rows.

