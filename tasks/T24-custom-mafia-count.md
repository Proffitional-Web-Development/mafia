# T24 — Custom Mafia Count Setting

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T02, T06, T07 |

## Description

Allow the room owner to manually choose the number of mafia players instead of relying on the automatic formula (`getMafiaCount` in `cardDistribution.ts` which assigns ~1/3 mafia based on player count). The owner-selected value must respect game balance rules: the number of mafia must always be strictly less than the number of citizens (including special citizen roles). When no custom value is set, the system falls back to the existing automatic calculation.

---

## Issue 1 — Schema & Validation Rules

**Problem:** The `rooms.settings` object has no field for a custom mafia count. The mafia count is hardcoded in `getMafiaCount()` inside `cardDistribution.ts` and is purely derived from player count.

**Requirement:** Add an optional `mafiaCount` field to room settings. Define clear validation rules that guarantee game balance.

### Game Balance Rules

The following constraints must be enforced at every validation point (room settings update, game start):

- **Rule 1 — Minimum mafia:** `mafiaCount >= 1`
- **Rule 2 — Mafia minority:** `mafiaCount < citizenCount`, where `citizenCount = playerCount - mafiaCount` (citizens include all non-mafia roles: citizen, sheikh, girl, boy)
- **Rule 3 — Simplified:** Combining Rules 1 and 2: `1 <= mafiaCount < Math.ceil(playerCount / 2)`
- **Rule 4 — Player minimum:** At least 4 players are required to start a game (1 mafia + 3 citizens minimum)

### Schema Changes

1. Add a `mafiaCount` field to `rooms.settings` in `schema.ts`:
   - `mafiaCount: v.optional(v.number())` — when `undefined` or `null`, use the existing automatic calculation
   - Position it alongside the existing `enabledRoles`, `discussionDuration`, and `maxPlayers` fields

### Backend Sub-Tasks

2. Create a shared validation helper `validateMafiaCount(mafiaCount: number, playerCount: number): { valid: boolean; maxAllowed: number; error?: string }` in a utility file (e.g. `lib/gameRules.ts` or inline in `cardDistribution.ts`):
   - Returns `valid: false` with a descriptive error if any rule is violated
   - Returns `maxAllowed` so the frontend can display the maximum selectable value
   - Example: for 8 players → `maxAllowed = 3` (4 mafia would equal citizens, violating Rule 2)
   - Example: for 5 players → `maxAllowed = 2`

---

## Issue 2 — Room Settings Mutation

**Problem:** The room creation and settings update mutations do not accept or validate a custom mafia count.

**Requirement:** The room owner can set a custom mafia count when creating the room or while in the lobby. The value must be validated against the current player count at game start time.

### Backend Sub-Tasks

3. Modify `createRoom` mutation in `rooms.ts`:
   - Accept an optional `mafiaCount` argument inside `settings`
   - If provided, validate using `validateMafiaCount(mafiaCount, maxPlayers)` at creation time as a preliminary check
   - Store the value in `settings.mafiaCount`
4. Modify `updateRoomSettings` mutation (or create one if it doesn't exist):
   - Accept optional `mafiaCount` in the settings payload
   - Only the room owner can update (existing authorization pattern)
   - Validate against current `maxPlayers` setting as a preliminary check
   - Allow setting `mafiaCount` to `null` / `undefined` to revert to automatic mode
5. Add a `getMaxAllowedMafia` query (or extend existing room state query):
   - Accepts `roomId` or derives from game context
   - Returns `{ maxAllowed: number, currentPlayerCount: number, autoMafiaCount: number }` so the frontend can show the valid range and the automatic default
   - `autoMafiaCount` is what `getMafiaCount()` would return for the current player count — shown as the "recommended" value

---

## Issue 3 — Card Distribution Integration

**Problem:** `buildRoleList()` in `cardDistribution.ts` calls `getMafiaCount(playerCount)` unconditionally and ignores any room-level override.

**Requirement:** When the room has a custom `mafiaCount` setting, use that value instead of the automatic formula. Re-validate at game start time to account for the actual player count (which may differ from `maxPlayers`).

### Backend Sub-Tasks

6. Modify `buildRoleList()` in `cardDistribution.ts`:
   - Accept an optional `customMafiaCount` parameter in the `RoomSettings` interface
   - If `customMafiaCount` is defined, use it instead of calling `getMafiaCount(playerCount)`
   - **Critical:** Re-validate `customMafiaCount` against the actual `playerCount` at game start (not `maxPlayers`):
     - If validation fails (e.g. players left the lobby and now `customMafiaCount >= citizenCount`), fall back to `getMafiaCount(playerCount)` and log a warning event
   - Ensure `citizenSlots = playerCount - mafiaCount` still correctly accounts for special roles (sheikh, girl, boy)
7. Modify the `distributeCards` mutation to read `settings.mafiaCount` from the room document and pass it to `buildRoleList()`
8. Add a guard in the game start flow (wherever `distributeCards` is triggered):
   - Final validation of `mafiaCount` against actual joined player count
   - If the custom count is invalid at start time, reset to auto and notify the owner via a status message or game event

---

## Issue 4 — Frontend: Mafia Count Selector

**Problem:** No UI exists for the room owner to choose the number of mafia players.

**Requirement:** Add a mafia count selector to the room creation flow and the lobby settings panel. The selector must show the valid range, the recommended (auto) value, and update reactively as player count changes.

### Frontend Sub-Tasks

9. Add a "Number of Mafia" selector to the room creation form:
   - Show a labeled numeric stepper or dropdown
   - Default selection: "Auto" (shows the recommended count in parentheses, e.g. "Auto (2)")
   - Manual options: `1` through `maxAllowed` based on `maxPlayers`
   - Display the game rule as helper text: "Mafia must be fewer than citizens"
10. Add a "Number of Mafia" selector to the lobby settings panel (owner-only):
    - Same stepper/dropdown as creation form
    - Reactively update `maxAllowed` when players join/leave the lobby (re-query `getMaxAllowedMafia`)
    - If the currently selected custom count becomes invalid (e.g. a player left), show a warning and auto-clamp or reset to "Auto"
    - Calls `updateRoomSettings` mutation on change
11. Display the current mafia count configuration in the lobby for all players (read-only for non-owners):
    - Show as a badge or info row: "Mafia: 2 (custom)" or "Mafia: Auto (2)"
    - Non-owners see the value but cannot change it
12. Add i18n keys for EN and AR:
    - `"room.settings.mafiaCount"` → "Number of Mafia" / "عدد المافيا"
    - `"room.settings.mafiaCountAuto"` → "Auto ({count})" / "تلقائي ({count})"
    - `"room.settings.mafiaCountCustom"` → "Custom" / "مخصص"
    - `"room.settings.mafiaCountHelper"` → "Mafia must be fewer than citizens" / "يجب أن يكون عدد المافيا أقل من المواطنين"
    - `"room.settings.mafiaCountInvalid"` → "Invalid: too many mafia for current players" / "غير صالح: عدد المافيا كبير جداً مقارنة باللاعبين الحاليين"
    - `"room.settings.mafiaCountReset"` → "Mafia count reset to auto due to player changes" / "تم إعادة تعيين عدد المافيا تلقائياً بسبب تغيّر اللاعبين"

---

## Issue 5 — Edge Cases & Safety

**Problem:** Player count can change between room configuration and game start (players joining/leaving). A custom mafia count that was valid at configuration time may become invalid at start time.

**Requirement:** Handle all edge cases gracefully with fallback behavior and user feedback.

### Backend Sub-Tasks

13. Handle the case where a player leaves after the owner sets a custom mafia count:
    - On player leave, check if `settings.mafiaCount` is still valid for the new player count
    - If invalid, do NOT silently change the setting — instead, mark it as `needsReview` (or simply let the game start validation catch it and fall back to auto)
14. Handle the case where `maxPlayers` is changed after `mafiaCount` is set:
    - Re-validate `mafiaCount` against the new `maxPlayers`
    - If invalid, reset `mafiaCount` to `undefined` (auto) and include a notification in the response
15. Ensure win condition checks in `endCheck` / resolution logic are not affected:
    - Win condition already checks `mafiaAlive >= citizenAlive` — this remains correct regardless of initial mafia count
    - Verify no hardcoded assumptions about mafia count exist in win condition logic

---

## Acceptance Criteria

- [ ] `rooms.settings` schema includes optional `mafiaCount` field
- [ ] Room owner can set a custom mafia count during room creation
- [ ] Room owner can update mafia count in the lobby before game starts
- [ ] Validation enforces `1 <= mafiaCount < ceil(playerCount / 2)` at all mutation points
- [ ] Card distribution uses the custom count when set, falls back to auto when not
- [ ] Final validation at game start re-checks against actual player count (not `maxPlayers`)
- [ ] Invalid custom count at game start gracefully falls back to auto with a notification
- [ ] UI shows valid range and recommended (auto) value
- [ ] UI reactively updates when player count changes
- [ ] Non-owner players can see the mafia count setting but cannot change it
- [ ] Win condition logic works correctly regardless of custom mafia count
- [ ] All new i18n keys added for EN and AR locales
- [ ] No regressions in existing card distribution or game flow
