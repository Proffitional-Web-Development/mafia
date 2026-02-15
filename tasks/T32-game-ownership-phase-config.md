# T32 — Game Ownership & Phase Configuration Expansion

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | XL |
| **Dependencies** | T02, T03, T06, T25 |

## Description

Expand game configuration to support per-phase time limit settings (including unlimited/null timeouts for manual control) and introduce two owner modes: Player Owner (participates normally) and Coordinator Owner (spectator with full visibility and manual phase control). When the owner is eliminated in player mode, they are automatically promoted to coordinator.

---

## Issue 1 — Per-Phase Time Limit Configuration

**Problem:** Phase durations are hardcoded in `web/convex/stateMachine.ts`: `PUBLIC_VOTING_MS = 45_000`, `ABILITY_PHASE_MS = 30_000`, `MAFIA_VOTING_MS = 45_000`. Only discussion duration is configurable via `room.settings.discussionDuration`. Owners cannot customize voting or ability phase lengths, nor disable timers entirely for manual control.

**Requirement:** Allow room owners to configure time limits for each timed phase independently, with support for unlimited time (`null`) meaning the owner must manually advance.

### Schema Changes

1. Add optional per-phase duration fields to `rooms.settings` in `web/convex/schema.ts`:
   - `publicVotingDuration: v.optional(v.union(v.number(), v.null()))` — seconds, default 45
   - `abilityPhaseDuration: v.optional(v.union(v.number(), v.null()))` — seconds, default 30
   - `mafiaVotingDuration: v.optional(v.union(v.number(), v.null()))` — seconds, default 45
   - `null` means unlimited time (owner manually advances the phase)
   - `undefined` (field not set) falls back to the existing defaults

### Backend Sub-Tasks

2. Update `getDeadlineMs()` in `web/convex/stateMachine.ts`:
   - Current: returns hardcoded constants per phase
   - New: read duration from `room.settings` for each phase:
     - `publicVoting` → `room.settings.publicVotingDuration ?? 45` (seconds → ms)
     - `abilityPhase` → `room.settings.abilityPhaseDuration ?? 30`
     - `mafiaVoting` → `room.settings.mafiaVotingDuration ?? 45`
     - `discussion` → `room.settings.discussionDuration` (already configurable)
   - If the resolved value is `null`, return `undefined` (no deadline)
   - Remove or deprecate the hardcoded `PUBLIC_VOTING_MS`, `ABILITY_PHASE_MS`, `MAFIA_VOTING_MS` constants

3. Update phase transition logic in `transitionCore()` (`web/convex/stateMachine.ts`):
   - When `getDeadlineMs()` returns `undefined` (unlimited time):
     - Set `phaseDeadlineAt` to `undefined` on the game document
     - Do NOT schedule `handlePhaseTimer` — no automatic phase resolution
   - Phase only advances when the owner calls `advancePhase` manually
   - Existing behavior for timed phases remains unchanged

4. Update `updateRoomSettings` mutation in `web/convex/rooms.ts`:
   - Accept the new phase duration fields
   - Validation for each: if not `null`, must be between 5 and 600 seconds
   - Allow `null` to represent unlimited time
   - Allow `undefined` to keep the default

5. Update `createRoom` mutation in `web/convex/rooms.ts`:
   - Accept optional phase duration settings
   - Initialize defaults if not provided:
     - `publicVotingDuration: 45`
     - `abilityPhaseDuration: 30`
     - `mafiaVotingDuration: 45`

### Frontend Sub-Tasks

6. Add per-phase duration controls to the lobby settings panel (`web/app/[locale]/game/room/[roomId]/page.tsx` or its `SettingsPanel`):
   - For each configurable phase (Public Voting, Ability Phase, Mafia Voting):
     - Number input for duration (5–600 seconds)
     - Checkbox or toggle: "Unlimited (Manual Control)"
     - When "Unlimited" is checked, disable the number input and set the value to `null`
   - Discussion duration remains as its existing slider/input
   - Owner-only — non-owners see read-only values

7. Update the in-game timer display:
   - When `phaseDeadlineAt` is `undefined` (unlimited time):
     - Instead of a countdown, show a label: "Manual Control" or "Waiting for host"
     - Show the owner's "Next Phase" button prominently (see Issue 4)
   - When `phaseDeadlineAt` is set: existing countdown behavior

8. Add i18n keys for EN and AR:
   - `"room.settings.publicVotingDuration"` → "Public Voting Duration" / "مدة التصويت العام"
   - `"room.settings.abilityPhaseDuration"` → "Ability Phase Duration" / "مدة مرحلة القدرات"
   - `"room.settings.mafiaVotingDuration"` → "Mafia Voting Duration" / "مدة تصويت المافيا"
   - `"room.settings.unlimited"` → "Unlimited (Manual Control)" / "غير محدود (تحكم يدوي)"
   - `"game.timer.manualControl"` → "Manual Control" / "تحكم يدوي"
   - `"game.timer.waitingForHost"` → "Waiting for host to advance" / "بانتظار المضيف للمتابعة"

---

## Issue 2 — Owner Mode: Player vs Coordinator

**Problem:** The room owner is always a regular player — they are assigned a random role, can only see their own card, and have no special visibility into private chats or other players' roles. There is no way for an owner to act as a neutral moderator/coordinator for in-person or organized games.

**Requirement:** Add an `ownerMode` setting with two modes:
1. **Player** (default): Owner plays normally with a random role. No special visibility.
2. **Coordinator**: Owner does NOT play. They have full visibility (all player roles, all chat channels including mafia) and full manual control (can advance any phase). They cannot vote or take role actions.

### Schema Changes

9. Add `ownerMode` to `rooms.settings` in `web/convex/schema.ts`:
   - `ownerMode: v.optional(v.union(v.literal("player"), v.literal("coordinator")))` — default `"player"`

10. Add `isCoordinator` flag to the `players` table in `web/convex/schema.ts`:
    - `isCoordinator: v.optional(v.boolean())` — default `false`
    - Set to `true` for coordinators and for eliminated owners promoted to coordinator (Issue 3)

### Backend Sub-Tasks

11. Update `createRoom` mutation in `web/convex/rooms.ts`:
    - Accept optional `ownerMode` in settings (default: `"player"`)

12. Update `updateRoomSettings` mutation:
    - Allow updating `ownerMode` only while room status is `"waiting"` (before game starts)
    - Validate value is `"player"` or `"coordinator"`

13. Update `startGame` mutation in `web/convex/rooms.ts`:
    - If `ownerMode === "coordinator"`:
      - Do NOT create a `players` record for the owner
      - The owner is excluded from card distribution and role assignment
      - Player count for game balance (mafia count, etc.) excludes the coordinator
    - If `ownerMode === "player"`:
      - Current behavior: create a player record for the owner with a random role

14. Create a `getCoordinatorState` query (in `web/convex/games.ts` or a new `coordinator.ts`):
    - Requires authenticated user
    - Validates the caller is the room owner AND is a coordinator (either `ownerMode === "coordinator"` or player has `isCoordinator: true`)
    - Returns full unredacted game state:
      - All players with their roles visible
      - All votes (public and mafia) with voter identities
      - All actions (sheikh investigations, girl protections) with targets and results
      - Current phase, round, deadlines
    - This query is only accessible to coordinators — reject non-coordinators

15. Update existing game state queries to support coordinator visibility:
    - `getGameState` (or equivalent): if the requester is a coordinator, include all roles in the response
    - Chat queries (`getChatMessages`): if the requester is a coordinator, return messages from both public and mafia channels

16. Block coordinators from game actions:
    - Update vote mutations (`castPublicVote`, `castMafiaVote`): reject if caller's player has `isCoordinator: true`
    - Update ability mutations (`useSheikhAbility`, `useGirlAbility`): reject if coordinator
    - Update `confirmAbilityAction`, `confirmVoting`: reject if coordinator
    - Return a clear error: `ConvexError("COORDINATOR_CANNOT_ACT")`

### Frontend Sub-Tasks

17. Add "Owner Mode" selector to the lobby settings panel:
    - Two options: "Play (Normal Player)" / "Coordinate (Full Visibility)"
    - Only visible to the room owner
    - Disabled after game starts
    - Show a description for each mode:
      - Player: "You play with a random role like everyone else"
      - Coordinator: "You watch with full visibility and control phase timing"

18. Create a `CoordinatorPanel` component in `web/components/game/coordinator-panel.tsx`:
    - Full-screen game view for coordinators showing:
      - All players with their roles (labeled, color-coded by faction)
      - Alive/dead status for each player
      - Current phase and round
      - "Next Phase" button (always visible, prominent)
      - All votes in real-time (who voted for whom)
    - Tabs or sections for:
      - Players & Roles
      - Public Chat (read-only)
      - Mafia Chat (read-only)
      - Game Events timeline
    - No action buttons (no voting, no ability use)

19. Update `GameRouter` in `web/components/game/game-router.tsx`:
    - Detect if current user is a coordinator
    - If coordinator: render `CoordinatorPanel` instead of the normal phase components
    - If regular player: existing behavior

20. Show coordinator status to other players:
    - In the lobby, indicate the owner is coordinating (not playing): "Host is coordinating this game"
    - In-game, don't show the coordinator in the player grid (they are not a player)
    - Optionally show a small "Coordinator: [Name]" label in the game header

21. Add i18n keys:
    - `"room.settings.ownerMode"` → "Owner Mode" / "وضع المالك"
    - `"room.settings.ownerModePlayer"` → "Play (Normal Player)" / "لعب (لاعب عادي)"
    - `"room.settings.ownerModePlayerDesc"` → "You play with a random role like everyone else" / "تلعب بدور عشوائي مثل الجميع"
    - `"room.settings.ownerModeCoordinator"` → "Coordinate (Full Visibility)" / "تنسيق (رؤية كاملة)"
    - `"room.settings.ownerModeCoordinatorDesc"` → "Watch with full visibility and control phase timing" / "شاهد برؤية كاملة وتحكم بتوقيت المراحل"
    - `"game.coordinator.title"` → "Coordinator View" / "عرض المنسق"
    - `"game.coordinator.hostCoordinating"` → "Host is coordinating this game" / "المضيف ينسق هذه اللعبة"
    - `"game.coordinator.cannotAct"` → "Coordinators cannot take actions" / "المنسقون لا يمكنهم اتخاذ إجراءات"

---

## Issue 3 — Owner Elimination → Auto-Promote to Coordinator

**Problem:** In player mode, if the owner is eliminated (via public vote, mafia kill, or boy revenge), they become a dead player with no special access. But as the room owner, they still need the ability to manage the game (advance phases, end game). Additionally, giving the eliminated owner full visibility rewards them with information that could bias future rounds if they communicate outside the app.

**Requirement:** When the owner is eliminated in player mode, automatically promote them to coordinator status. This gives them full visibility (all roles, all chats) and manual phase control, but they can no longer vote or take actions.

### Backend Sub-Tasks

22. Update the elimination logic (wherever `isAlive` is set to `false`):
    - After marking a player as eliminated, check if the player is the room owner
    - If the eliminated player is the room owner AND `room.settings.ownerMode === "player"`:
      - Set `isCoordinator: true` on the player's record
      - Log a game event: `"OWNER_PROMOTED_COORDINATOR"` (add to `gameEvents` event types if using T22)
    - The player remains in the `players` table (still shows as eliminated) but gains coordinator privileges

23. Update the coordinator check in all relevant queries:
    - A user is a coordinator if:
      - `room.settings.ownerMode === "coordinator"` (coordinator from the start), OR
      - Their player record has `isCoordinator === true` (promoted after elimination)
    - Update `getCoordinatorState`, game state queries, and chat queries to check both conditions

### Frontend Sub-Tasks

24. Show a notification when the owner is eliminated and promoted:
    - Display a modal or prominent banner: "You have been eliminated! As the host, you now have full visibility and can control the game."
    - Transition the UI from the normal player view to the `CoordinatorPanel`

25. Update the coordinator panel to show the owner's previous role and elimination status:
    - Mark the owner in the player list as "Eliminated (Coordinator)" with a distinct badge
    - Show their original role for reference

26. Add i18n keys:
    - `"game.coordinator.promoted"` → "You've been eliminated! As the host, you now have coordinator access." / "تم إقصاؤك! بصفتك المضيف، لديك الآن صلاحية المنسق."
    - `"game.coordinator.eliminatedBadge"` → "Eliminated (Coordinator)" / "مُقصى (منسق)"

---

## Issue 4 — Manual Phase Advancement

**Problem:** When a phase has unlimited time (`null` duration from Issue 1), there is no automatic timer to advance the phase. The owner (or coordinator) needs a clear, always-available button to manually move to the next phase. The existing `advancePhase` mutation supports owner override, but the UI does not surface it prominently.

**Requirement:** Provide a persistent "Next Phase" button for the owner/coordinator. The button is prominent when the phase has unlimited time, and available as a secondary action when the phase has a timer.

### Backend Sub-Tasks

27. Update `advancePhase` mutation in `web/convex/stateMachine.ts`:
    - Current: checks `isRoomOwner` for the `ownerOverride` flag
    - New: also allow advancement if the requester's player has `isCoordinator === true`
    - Ensure coordinators who were not assigned a player record (coordinator mode from start) can also call this — check by `room.ownerId` in addition to player record

### Frontend Sub-Tasks

28. Add a persistent "Next Phase" button to the game UI:
    - Visible only to the room owner (player or coordinator mode)
    - Positioning:
      - In coordinator panel: prominent at the top, always visible
      - In player view (owner playing): floating action button or in the game header
    - Button states:
      - When phase has unlimited time (`null` duration): prominent, primary variant, label "Next Phase"
      - When phase has a timer: secondary/subtle variant, label "Skip Timer"
    - On click: show a confirmation prompt before advancing
    - Disabled during phase transitions (prevent double-clicks)

29. Add a confirmation dialog before manual advancement:
    - Message: "Advance to next phase? Players may not have completed their actions."
    - Buttons: "Cancel" / "Advance"

30. Add i18n keys:
    - `"game.advancePhase"` → "Next Phase" / "المرحلة التالية"
    - `"game.skipTimer"` → "Skip Timer" / "تخطي المؤقت"
    - `"game.advancePhaseConfirm"` → "Advance to next phase? Players may not have completed their actions." / "الانتقال للمرحلة التالية؟ قد لا يكون اللاعبون قد أكملوا إجراءاتهم."

---

## Issue 5 — Coordinator Chat Access

**Problem:** The current chat system (T25) restricts mafia channel access to mafia-role players only. Coordinators need read-only access to all channels for game moderation.

**Requirement:** Grant coordinators read-only access to both public and mafia chat channels. Coordinators cannot send messages.

### Backend Sub-Tasks

31. Update `getChatMessages` query in `web/convex/chat.ts`:
    - If the requester is a coordinator (check `isCoordinator` flag or `ownerMode === "coordinator"`):
      - Return messages from the requested channel regardless of role
      - This includes the mafia channel — coordinators can read it
    - Non-coordinator, non-mafia players: existing behavior (mafia channel returns empty array)

32. Update `sendChatMessage` mutation in `web/convex/chat.ts`:
    - If the caller is a coordinator (no player record or `isCoordinator: true`):
      - Reject with `ConvexError("COORDINATOR_CANNOT_CHAT")`
    - Coordinators observe only — they do not participate in chat

### Frontend Sub-Tasks

33. In the `CoordinatorPanel`, render both chat channels:
    - Two tabs: "Public Chat" / "Mafia Chat"
    - Both are read-only (no `ChatInput` component)
    - Show a label: "Read-only — Coordinators cannot send messages"
    - Mafia messages display sender info (coordinators can see who said what)

34. Add i18n keys:
    - `"chat.coordinatorReadOnly"` → "Read-only — Coordinators cannot send messages" / "للقراءة فقط — لا يمكن للمنسقين إرسال رسائل"

---

## Acceptance Criteria

- [ ] Room owners can configure time limits for public voting, ability phase, and mafia voting (5–600 seconds or unlimited)
- [ ] Setting a phase duration to `null` disables the timer; phase only advances via manual "Next Phase" button
- [ ] Default phase durations match existing values when no custom settings are provided (45s / 30s / 45s)
- [ ] Owner can choose "Player" or "Coordinator" mode before starting the game
- [ ] In Player mode, the owner plays normally with no special visibility
- [ ] In Coordinator mode, the owner is not assigned a role, can see all roles, all chats, and all votes
- [ ] When the owner is eliminated in Player mode, they are auto-promoted to coordinator with full visibility
- [ ] Promoted coordinator sees a notification and transitions to the coordinator UI
- [ ] Coordinators cannot vote, use abilities, or send chat messages
- [ ] Manual "Next Phase" button is available to owner/coordinator in all phases
- [ ] Confirmation prompt shown before manual phase advancement
- [ ] Coordinator can read both public and mafia chat channels (read-only)
- [ ] Player count for game balance (mafia count) excludes the coordinator
- [ ] Non-owner players are unaffected by the new settings
- [ ] All i18n keys added for EN and AR
- [ ] No regressions in existing game flow when defaults are used
