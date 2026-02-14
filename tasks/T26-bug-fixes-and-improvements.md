# T26 — Bug Fixes & Improvements (Event Log Privacy, Scroll, i18n, Room Link Join)

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | L |
| **Dependencies** | T06, T10, T22, T25 |

## Description

Fix four issues identified during QA: event logs leaking private ability details (Girl protection target, Sheikh investigation target), a scroll bug in the event timeline where the last element is partially hidden, missing Arabic translations, and incorrect behavior when a user opens a room link they are not a member of.

---

## Issue 1 — Event Log Privacy: No Ability Targets in Public Events

**Problem:** Event logs currently reveal private ability information — specifically who the Girl protected and who the Sheikh investigated. The `getGameEvents` query already masks the faction result (mapping `SHEIKH_INVESTIGATION_CITIZEN` / `SHEIKH_INVESTIGATION_MAFIA` to a generic `SHEIKH_INVESTIGATION` type), but the `messageParams` can still contain the target player name, and the Girl's protection target is exposed in event messages.

**Requirement:** Public event log messages must never identify the target of any private ability. Only the outcome is shown generically. Detailed ability results remain private and accessible only through the Sheikh's investigation log and the Girl's protection log (implemented in T21).

### Allowed Public Event Messages

- "The Sheikh completed an investigation."
- "The Mafia attempted an elimination, but the target was protected."
- "The Girl's protection was successful this round."

### Disallowed Public Event Messages

- "The Girl protected {player}." — leaks target
- "The Sheikh investigated {player} and found they are Mafia." — leaks target and result
- "The Sheikh investigated {player}." — leaks target even without result

### Backend Sub-Tasks

1. Audit `logGameEvent` callsites in `abilityPhase.ts`:
   - For `SHEIKH_INVESTIGATION_CITIZEN` and `SHEIKH_INVESTIGATION_MAFIA` events: ensure `messageParams` does NOT include `player` (the investigated target's name)
   - The public message template must be target-neutral: e.g. `"events.SHEIKH_INVESTIGATION.normal.1"` → "The Sheikh completed an investigation this round."
   - If `player` is currently in `messageParams`, remove it and update templates to not use `{player}`
2. Audit `logGameEvent` callsites for Girl-related events:
   - For `MAFIA_FAILED_ELIMINATION` events: ensure `messageParams` does NOT include the Girl's name or the protected player's name
   - The public message must be generic: e.g. "The Mafia's target was protected — no one was eliminated."
   - If the current template references `{player}` as the protected target, replace with a generic message
3. Update the `sanitizePublicParams` function in `gameEvents.ts`:
   - For `SHEIKH_INVESTIGATION_CITIZEN`, `SHEIKH_INVESTIGATION_MAFIA`: strip `player`, `targetName`, or any player-identifying fields from the returned `messageParams`
   - For `MAFIA_FAILED_ELIMINATION`: strip `protectedPlayer`, `girlTarget`, or any field that identifies who was protected
   - Whitelist approach: only pass through explicitly safe param keys (e.g. `round`) rather than blacklisting specific fields
4. Update the `getPublicMessageKey` function in `gameEvents.ts`:
   - Ensure Sheikh investigation events all resolve to the same generic public message key family (e.g. `events.SHEIKH_INVESTIGATION.*`) regardless of the internal `eventType`
   - Ensure `MAFIA_FAILED_ELIMINATION` resolves to a key that does not reference any player name

### i18n Sub-Tasks

5. Audit and update EN templates in `messages/en.json`:
   - `events.SHEIKH_INVESTIGATION.normal.*` — must not contain `{player}` placeholder
   - `events.SHEIKH_INVESTIGATION.fun.*` — must not contain `{player}` placeholder
   - `events.SHEIKH_INVESTIGATION.chaos.*` — must not contain `{player}` placeholder
   - `events.MAFIA_FAILED_ELIMINATION.*` — must not contain `{player}` referencing the protected target or the Girl
   - Example valid templates:
     - Normal: "The Sheikh has conducted an investigation."
     - Fun: "🔍 The Sheikh pulled out the magnifying glass. Results are classified."
     - Chaos: "🕵️ Sheikh did some snooping. No comment on the findings."
6. Audit and update AR templates in `messages/ar.json`:
   - Same rules as English — remove all `{player}` placeholders from investigation and protection events

---

## Issue 2 — Event Timeline Scroll Bug

**Problem:** The last element in the `GameEventTimeline` scrollable list is partially hidden — the bottom of the last event row is clipped and not fully visible.

**Requirement:** All event rows, including the last one, must be fully visible and scrollable into view.

### Frontend Sub-Tasks

7. Diagnose and fix the scroll clipping in `GameEventTimeline`:
   - Likely cause: the scrollable container (`max-h-*` with `overflow-y-auto`) has no bottom padding, so the last item's bottom edge is flush with the container boundary and gets clipped by border-radius or adjacent elements
   - Fix: add `pb-2` or `pb-4` padding-bottom inside the scrollable container to ensure the last element has breathing room
   - Alternative: if the container uses `max-h-28` (from `InvestigationLog` pattern), increase to `max-h-64` or a more appropriate height and verify with `pb-` padding
8. Verify the fix across:
   - Short lists (1–3 events): no unnecessary scroll, all items visible
   - Long lists (10+ events): scrollable, last item fully visible when scrolled to bottom
   - Both LTR and RTL layouts
   - Mobile viewports (small screens)

---

## Issue 3 — Missing Arabic Translations

**Problem:** Some UI strings appear in English when the locale is set to Arabic. Specific untranslated keys were found during QA testing.

**Requirement:** All user-facing strings must have Arabic translations in `messages/ar.json`.

### Frontend Sub-Tasks

9. Run a systematic audit of all i18n keys:
   - Compare all keys in `messages/en.json` against `messages/ar.json`
   - Identify any keys present in EN but missing in AR
   - Generate a list of missing keys
10. Add missing Arabic translations for all identified keys:
    - Translate each missing key to Arabic
    - Ensure RTL-compatible phrasing (no broken mixed-direction text)
    - Pay special attention to recently added feature namespaces:
      - `events.*` (T22 — game event history)
      - `chat.*` (T25 — chat system)
      - `reactions.*` (T25 — emoji reactions)
      - `room.settings.*` (T24 — mafia count, room settings)
      - `settings.*` (T23 — settings page)
11. Add a build-time or CI validation step (optional but recommended):
    - Script that compares EN and AR key sets and reports mismatches
    - Can be a simple Node script: parse both JSON files, diff the key trees, exit non-zero if keys are missing

---

## Issue 4 — Room Link Join Behavior for Non-Members

**Problem:** When a user navigates to a room via a shared link (e.g. `/room/ABCD`) and they are not a member of that room, the app shows an error or broken state. The expected behavior depends on whether the game has started.

**Requirement:**
- If the game has **not started** (room status is `"waiting"`): auto-join the user to the room
- If the game has **already started** (room status is `"in-game"` or `"finished"`): redirect the user to the home page with a feedback message

### Backend Sub-Tasks

12. Create a `joinRoomByLink` mutation (or extend the existing `joinRoom` mutation) in `rooms.ts`:
    - Accepts `{ code: string }` (the room code from the URL)
    - Looks up the room by code
    - If room not found: throw `ConvexError("ROOM_NOT_FOUND")`
    - If room status is `"waiting"`:
      - Check if user is already a member — if yes, return `{ status: "already_joined", roomId }`
      - Check if room is full (`memberCount >= maxPlayers`) — if yes, throw `ConvexError("ROOM_FULL")`
      - If room is private with a password: throw `ConvexError("PASSWORD_REQUIRED")` (user must enter password separately)
      - Otherwise: add user as a room member and return `{ status: "joined", roomId }`
    - If room status is `"in-game"` or `"finished"`:
      - Check if user is already a member — if yes, return `{ status: "already_joined", roomId }` (allow reconnection)
      - If not a member: return `{ status: "game_started", roomId: null }` (frontend handles redirect)
13. Ensure the `joinRoom` mutation respects the `maxPlayers` setting:
    - Verify that the current member count is checked against `room.settings.maxPlayers` before adding a new member
    - If this check is missing in the existing `joinRoom`, add it

### Frontend Sub-Tasks

14. Update the room page component (wherever the room code route is handled) to implement the join-by-link flow:
    - On page load, if the user is not a member of the room:
      - Call `joinRoomByLink` with the room code from the URL
      - If `status === "joined"`: render the room normally (user is now a member)
      - If `status === "already_joined"`: render the room normally
      - If `status === "game_started"`: redirect to home page with a toast message: "This game has already started"
      - If error `"ROOM_FULL"`: redirect to home page with a toast: "This room is full"
      - If error `"PASSWORD_REQUIRED"`: show a password prompt, then retry with the password
    - Show a loading state while the join attempt is in progress
15. Add i18n keys for join-by-link messages:
    - `"room.join.gameStarted"` → "This game has already started" / "هذه اللعبة بدأت بالفعل"
    - `"room.join.roomFull"` → "This room is full" / "هذه الغرفة ممتلئة"
    - `"room.join.notFound"` → "Room not found" / "الغرفة غير موجودة"
    - `"room.join.passwordRequired"` → "This room requires a password" / "هذه الغرفة تتطلب كلمة مرور"

---

## Acceptance Criteria

- [ ] Public event logs do not reveal who the Sheikh investigated
- [ ] Public event logs do not reveal who the Girl protected
- [ ] Public event messages use generic, target-neutral language for ability events
- [ ] Sheikh's investigation details remain private (visible only in Sheikh's private investigation log)
- [ ] Girl's protection details remain private (visible only in Girl's private protection log)
- [ ] `sanitizePublicParams` strips all player-identifying fields from ability event params
- [ ] The last event in the timeline scroll is fully visible (no clipping)
- [ ] Scroll fix verified on mobile, desktop, LTR, and RTL
- [ ] All i18n keys in `messages/en.json` have corresponding entries in `messages/ar.json`
- [ ] No untranslated strings visible in the Arabic locale
- [ ] Non-member users arriving via room link are auto-joined if room is in `"waiting"` status
- [ ] Non-member users arriving via room link are redirected to home if game is in progress
- [ ] Room full and password-required cases are handled with appropriate feedback
- [ ] No regressions in existing game flow
