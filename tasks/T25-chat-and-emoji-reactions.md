# T25 — Chat System with Emoji Reactions & Predefined Templates

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P2 |
| **Complexity** | XL |
| **Dependencies** | T02, T06, T07, T09, T05 |

## Description

Implement a real-time in-room chat system with two channels (public and mafia-private), emoji reactions during voting phases, and a library of predefined template messages with placeholder support. The system must enforce role-based visibility, support owner-level controls (enable/disable chat, mute), and be fully i18n-ready for English and Arabic.

---

## Issue 1 — Emoji Reactions During Voting

**Problem:** During voting phases, players have no way to express their feelings or signal intentions beyond casting a vote. There is no reaction system on player cards.

**Requirement:** During the public voting phase, each player can select one emoji reaction that appears on their player card in real time. Reactions are optional, visible to all players, and reset each voting round.

### Schema Changes

1. Add an `emojiReaction` field to the `players` table in `schema.ts`:
   - `emojiReaction: v.optional(v.string())` — stores the selected emoji (e.g. `"😂"`, `"🤔"`, `"😱"`, `"😤"`, `"😭"`, `"😢"`)
   - Cleared at the start of each voting phase (or each round)

### Backend Sub-Tasks

2. Create a `setEmojiReaction` mutation in a new `reactions.ts` convex file:
   - Requires authenticated user
   - Validates the caller is an alive player in the game
   - Validates the game is in `publicVoting` phase (reactions only allowed during voting)
   - Accepts `emoji: v.union(v.string(), v.null())` — `null` to clear the reaction
   - Validates the emoji is from an allowed set (define an `ALLOWED_EMOJIS` constant with ~20–30 common emojis to prevent abuse)
   - Updates the `emojiReaction` field on the player document
3. Add a reset step in the phase transition logic (`stateMachine.ts` or `publicVoting.ts`):
   - When entering `publicVoting` phase, clear all players' `emojiReaction` fields for the game
   - This ensures reactions don't persist across rounds
4. Expose `emojiReaction` in existing player queries:
   - Ensure `getPublicVotingState` (or equivalent query that returns player data during voting) includes the `emojiReaction` field for each player
   - All players can see all reactions (reactions are public)

### Frontend Sub-Tasks

5. Add an emoji picker to the voting phase UI:
   - Small floating button near the player's own card or at the bottom of the voting screen
   - On tap, show a grid of allowed emojis (match the `ALLOWED_EMOJIS` list from backend)
   - Selecting an emoji calls `setEmojiReaction` and closes the picker
   - Tapping the same emoji again or a "clear" button sends `null` to remove the reaction
6. Display emoji reactions on player cards:
   - Show the selected emoji as a floating badge on the player card (top-right corner or similar)
   - Animate the emoji appearance (subtle scale-in or bounce)
   - Update in real time as other players set/change their reactions
7. Add i18n keys:
   - `"reactions.pickEmoji"` → "React" / "تفاعل"
   - `"reactions.clear"` → "Clear" / "مسح"

---

## Issue 2 — Chat Schema & Channels

**Problem:** No chat infrastructure exists in the application. Players cannot communicate via text within the room.

**Requirement:** Support two chat channels — a public channel visible to all room members, and a mafia-private channel automatically created and restricted to mafia-role players. Messages are stored server-side, ordered chronologically, and delivered in real time.

### Schema Changes

8. Add a `chatMessages` table to `schema.ts`:
   - `gameId: v.id("games")` — the game this message belongs to
   - `channel: v.union(v.literal("public"), v.literal("mafia"))` — which chat channel
   - `senderId: v.id("users")` — the user who sent the message
   - `senderUsername: v.string()` — denormalized for display efficiency
   - `content: v.string()` — the message text (max 500 characters)
   - `isTemplate: v.optional(v.boolean())` — whether this message was sent via a predefined template
   - `templateKey: v.optional(v.string())` — the i18n key if sent via template (for localized rendering)
   - `templateParams: v.optional(v.any())` — placeholder values for template messages (e.g. `{ player: "Ahmed" }`)
   - `timestamp: v.number()` — `Date.now()` when the message was sent
   - Indexes:
     - `by_gameId_channel` on `["gameId", "channel"]` — for fetching messages per channel
     - `by_gameId_timestamp` on `["gameId", "timestamp"]` — for chronological ordering

9. Add chat control fields to the `rooms.settings` object in `schema.ts`:
   - `chatEnabled: v.optional(v.boolean())` — whether public chat is enabled (default: `true`)

---

## Issue 3 — Chat Backend Logic

**Problem:** No mutations or queries exist for sending or reading chat messages.

**Requirement:** Implement send/receive logic with permission enforcement — public messages visible to all, mafia messages visible only to mafia members. Room owner can enable/disable public chat and mute all players.

### Backend Sub-Tasks

10. Create a `sendChatMessage` mutation in a new `chat.ts` convex file:
    - Requires authenticated user
    - Validates the caller is a player in the game
    - Accepts `{ gameId, channel, content }` (or `{ gameId, channel, templateKey, templateParams }` for template messages)
    - **Permission checks:**
      - `"public"` channel: allowed if `room.settings.chatEnabled !== false` and the game is not in a muted state
      - `"mafia"` channel: allowed only if the player's role is `"mafia"` — throw `ConvexError("NOT_MAFIA_MEMBER")` otherwise
    - **Validation:**
      - `content` max 500 characters, trimmed, non-empty
      - Rate limit: max 5 messages per 10 seconds per user (prevent spam) — implement via a simple timestamp check against recent messages
    - Inserts a `chatMessages` record with denormalized `senderUsername`
11. Create a `getChatMessages` query in `chat.ts`:
    - Accepts `{ gameId, channel }`
    - **Permission checks:**
      - `"public"` channel: allowed for any player in the game
      - `"mafia"` channel: allowed only for players with role `"mafia"` — return empty array (not an error) for non-mafia to avoid leaking channel existence
    - Returns messages ordered by `timestamp` ascending (oldest first)
    - Paginate or limit to last 100 messages to prevent excessive data transfer
12. Create a `toggleChat` mutation (owner-only):
    - Accepts `{ roomId, enabled: boolean }`
    - Validates the caller is the room owner
    - Updates `room.settings.chatEnabled`
    - When disabling: does not delete existing messages, just prevents new ones
13. Create a `muteAllChat` mutation (owner-only):
    - Accepts `{ gameId, muted: boolean }`
    - Sets a `chatMuted` flag on the game document (add `chatMuted: v.optional(v.boolean())` to the `games` table)
    - When muted, `sendChatMessage` rejects all public channel messages with error `"CHAT_MUTED"`
    - Mafia channel is NOT affected by mute (mafia can always communicate among themselves)

---

## Issue 4 — Predefined Template Messages

**Problem:** Players need quick-access message templates for common game situations, especially useful on mobile where typing is slow.

**Requirement:** Provide a library of predefined chat templates with placeholder support. Templates must be i18n-ready and render correctly in the chat stream for all players regardless of their language setting.

### Backend Sub-Tasks

14. Define a template registry in `chat.ts` (or a separate `chatTemplates.ts`):
    - Each template has: `key` (i18n message key), `placeholders` (list of placeholder names), `channel` (which channels it's available in)
    - Template list:
      ```
      chat.template.suspect       → "I suspect {player}"          → placeholders: [player] → channels: [public]
      chat.template.voteFor       → "Vote for {player}"           → placeholders: [player] → channels: [public]
      chat.template.trustMe       → "Trust me, I'm innocent"      → placeholders: []       → channels: [public]
      chat.template.waitNextRound → "Let's wait for the next round" → placeholders: []     → channels: [public]
      chat.template.followMyLead  → "Follow my lead"              → placeholders: []       → channels: [public]
      chat.template.sayNothing    → "Stay quiet, don't reveal anything" → placeholders: [] → channels: [public]
      chat.template.mafiaTarget   → "Target {player} tonight"     → placeholders: [player] → channels: [mafia]
      chat.template.mafiaAvoid    → "Don't target {player}"       → placeholders: [player] → channels: [mafia]
      chat.template.mafiaBlend    → "Act normal, blend in"        → placeholders: []       → channels: [mafia]
      chat.template.mafiaAgree    → "Agreed"                      → placeholders: []       → channels: [mafia]
      ```
    - Expose a `getTemplates` query that returns the available templates for the current player's role and channel
15. When sending a template message, store both `templateKey` and `templateParams` on the `chatMessages` record:
    - On the receiving end, the frontend resolves the message using `t(templateKey, templateParams)` so each player sees the message in their own language
    - Also store a `content` fallback (English resolved text) for robustness

### i18n Sub-Tasks

16. Add English template messages to `messages/en.json` under a `chat.template` namespace:
    - All templates listed above
    - Include channel label keys: `"chat.channel.public"` → "Public Chat", `"chat.channel.mafia"` → "Mafia Chat"
17. Add Arabic template messages to `messages/ar.json` under the same namespace:
    - Same keys, Arabic translations
    - Ensure placeholders work correctly with RTL text

---

## Issue 5 — Chat UI Components

**Problem:** No chat UI exists in the game interface.

**Requirement:** Build a chat panel accessible during gameplay with channel tabs, message input, template picker, and real-time message streaming.

### Frontend Sub-Tasks

18. Create a `ChatPanel` component in `components/game/chat-panel.tsx`:
    - Two channel tabs: "Public" and "Mafia" (mafia tab only visible to mafia players)
    - Scrollable message list (newest at bottom, auto-scroll on new messages)
    - Each message row shows:
      - Sender avatar (small) and username (bold)
      - Message content
      - Relative timestamp (e.g. "1m ago")
    - Template messages render using `t(templateKey, templateParams)` — shown with a subtle template indicator (e.g. small icon or different background)
    - Empty state per channel: "No messages yet — say something!"
19. Create a `ChatInput` component:
    - Text input with send button
    - Max 500 character limit with character counter
    - Disabled state when chat is disabled or muted (show a banner: "Chat is disabled by the room owner" / "Chat is muted")
    - Submit on Enter key (desktop) or send button tap (mobile)
20. Create a `TemplatePickerPopover` component:
    - Triggered by a lightning bolt or template icon button next to the chat input
    - Shows a list of available templates for the current channel
    - Templates with `{player}` placeholder show a secondary player selection step:
      1. User picks a template → if it has placeholders, show a mini player grid to select the target
      2. On player selection, send the template message with filled params
    - Templates without placeholders send immediately on tap
21. Integrate the `ChatPanel` into the game layout:
    - Add a chat icon button in the game header (next to settings, game log, etc.)
    - On tap, open the chat as a slide-over panel (from the right on LTR, left on RTL) or a bottom sheet on mobile
    - Badge the chat icon with unread message count (messages received since the panel was last open)
    - Keep the panel mountable/unmountable without losing scroll position (use state, not remount)
22. Handle owner controls in the UI:
    - If the current user is the room owner, show a toggle in the chat panel header: "Chat Enabled" / "Mute All"
    - Toggle calls `toggleChat` or `muteAllChat` mutation
    - Non-owners see a read-only indicator when chat is disabled or muted

---

## Issue 6 — Permission Enforcement & Security

**Problem:** Chat channels must strictly enforce role-based access to prevent information leakage between factions.

**Requirement:** Mafia chat is invisible to non-mafia players. Public chat respects owner controls. No message content from the mafia channel can leak to the public channel or non-mafia players.

### Backend Sub-Tasks

23. Ensure `getChatMessages` for the `"mafia"` channel returns an empty array (not an error) for non-mafia players:
    - This prevents the frontend from even knowing whether mafia messages exist
    - Do NOT return a permission error — that would reveal the channel has content
24. Ensure `sendChatMessage` for the `"mafia"` channel throws `ConvexError` for non-mafia players:
    - Error key: `"NOT_MAFIA_MEMBER"`
    - The frontend should never call this for non-mafia (tab is hidden), but enforce server-side as defense in depth
25. Prevent eliminated players from sending messages:
    - Dead players can still read the public chat (spectator mode) but cannot send messages
    - Dead mafia players can still read the mafia chat but cannot send messages
    - Show a "You are eliminated — spectating" banner in the chat input area
26. Rate limit enforcement:
    - Implement the rate limit (5 messages / 10 seconds) server-side in `sendChatMessage`
    - Query the last 5 messages by the same user in the same game; if the oldest is within 10 seconds, reject with `ConvexError("RATE_LIMITED")`
    - Frontend shows a brief cooldown indicator when rate limited

---

## Issue 7 — RTL & Mobile Support

**Problem:** Chat must work correctly in both LTR (English) and RTL (Arabic) layouts, and be usable on mobile devices.

**Requirement:** Chat panel, message bubbles, template picker, and emoji picker must all render correctly in RTL and be touch-friendly on mobile.

### Frontend Sub-Tasks

27. Ensure chat panel layout respects `dir="rtl"`:
    - Message sender name and content align correctly
    - Slide-over panel opens from the correct side
    - Template picker and emoji picker render correctly
28. Ensure mobile usability:
    - Chat panel as a bottom sheet on small screens (full-width, half-height)
    - Template picker as a scrollable horizontal row or compact grid
    - Emoji picker as a compact grid that doesn't overflow the viewport
    - Keyboard handling: input field stays visible when the mobile keyboard is open
29. Add all remaining i18n keys for EN and AR:
    - `"chat.title"` → "Chat" / "الدردشة"
    - `"chat.send"` → "Send" / "إرسال"
    - `"chat.placeholder"` → "Type a message..." / "...اكتب رسالة"
    - `"chat.disabled"` → "Chat is disabled by the room owner" / "الدردشة معطلة من قبل مالك الغرفة"
    - `"chat.muted"` → "Chat is muted" / "الدردشة مكتومة"
    - `"chat.eliminated"` → "You are eliminated — spectating" / "تم إقصاؤك — مشاهدة فقط"
    - `"chat.rateLimited"` → "Slow down! Try again in a moment" / "!تمهّل! حاول مرة أخرى بعد لحظة"
    - `"chat.empty"` → "No messages yet" / "لا رسائل بعد"
    - `"chat.unread"` → "{count} new" / "{count} جديد"
    - `"chat.enableChat"` → "Enable Chat" / "تفعيل الدردشة"
    - `"chat.muteAll"` → "Mute All" / "كتم الجميع"

---

## Acceptance Criteria

- [ ] Players can select an emoji reaction during voting; reaction appears on their player card in real time
- [ ] Emoji reactions reset at the start of each voting phase
- [ ] Public chat is visible to all players and controlled by the room owner (enable/disable, mute)
- [ ] Mafia chat is private, auto-created, and restricted to mafia-role players only
- [ ] Non-mafia players cannot see, infer, or access the mafia chat channel
- [ ] Predefined templates are available with placeholder support and quick-select UI
- [ ] Template messages render in each player's language via i18n key resolution
- [ ] Eliminated players can read but not send messages (spectator mode)
- [ ] Rate limiting prevents chat spam (5 messages / 10 seconds per user)
- [ ] Chat updates are real-time via Convex subscriptions
- [ ] Chat panel is accessible from any game phase via a persistent header button
- [ ] Unread badge shows on the chat icon when new messages arrive
- [ ] All i18n keys added for EN and AR locales
- [ ] RTL layout renders correctly for Arabic
- [ ] Mobile-friendly layout (bottom sheet, touch targets, keyboard handling)
- [ ] No regressions in existing game flow
