# T29 — Anonymous Mafia Messaging in Public Chat

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P2 |
| **Complexity** | M |
| **Dependencies** | T25 |

## Description

Allow mafia players to send messages to the **public chat** either under their real username or under the anonymous alias **"MAFIA"**, without revealing their identity. This gives mafia members a tool for psychological warfare — they can taunt, mislead, or intimidate citizens while remaining hidden. Non-mafia players cannot send anonymous messages.

---

## Issue 1 — Anonymous Send Mode for Mafia

**Problem:** The current `sendChatMessage` mutation (T25) always stores the sender's real `senderId` and `senderUsername` on every public message. Mafia players have no way to send a public message without exposing their identity.

**Requirement:** Mafia players can choose to send a public chat message as "MAFIA" (anonymous). The message is stored without any link to the real sender that could be exposed to other players. Only the mafia channel and the backend know the true sender.

### Schema Changes

1. Add fields to the `chatMessages` table in `schema.ts`:
   - `isAnonymous: v.optional(v.boolean())` — `true` when the message was sent anonymously
   - `anonymousAlias: v.optional(v.string())` — the display name used (e.g. `"MAFIA"`), stored for rendering
   - `realSenderId: v.optional(v.id("users"))` — the actual sender, stored for moderation/audit purposes only, **never returned to the frontend** for anonymous messages

### Backend Sub-Tasks

2. Modify the `sendChatMessage` mutation in `chat.ts`:
   - Accept an optional `anonymous: v.optional(v.boolean())` argument
   - **Validation rules:**
     - Only players with role `"mafia"` can send anonymous messages — if a non-mafia player sets `anonymous: true`, throw `ConvexError("ANONYMOUS_NOT_ALLOWED")`
     - Anonymous messages are only allowed on the `"public"` channel — anonymous on the `"mafia"` channel makes no sense (all mafia members know each other) and must be rejected
     - All other existing validations still apply (rate limits, chat enabled, not muted, not eliminated, content length)
   - **When `anonymous === true`:**
     - Set `senderId` to a sentinel value or omit it (see sub-task 3)
     - Set `senderUsername` to the localized anonymous alias (e.g. `"MAFIA"`)
     - Set `isAnonymous` to `true`
     - Set `anonymousAlias` to `"MAFIA"`
     - Set `realSenderId` to the actual user's ID (for audit only)
   - **When `anonymous` is `false` or omitted:**
     - Existing behavior: store real `senderId` and `senderUsername`

3. Handle the `senderId` field for anonymous messages:
   - Option A (recommended): Store the real `senderId` normally but filter it out in the query layer (sub-task 4). This avoids schema changes to make `senderId` optional.
   - The `realSenderId` field serves as a backup reference that is never exposed.

4. Modify the `getChatMessages` query in `chat.ts`:
   - For messages where `isAnonymous === true` on the `"public"` channel:
     - Replace `senderId` with `null` or a static placeholder ID in the returned object
     - Replace `senderUsername` with the `anonymousAlias` value (e.g. `"MAFIA"`)
     - **Never return `realSenderId`** to any frontend consumer
   - For the `"mafia"` channel: return all messages with real sender info (mafia members already know each other, and anonymous messages can't be sent on this channel)
   - This filtering happens in the query, not in the mutation, so the raw data remains auditable server-side

5. Ensure rate limits apply equally to anonymous messages:
   - The rate limit (5 messages / 10 seconds) must count anonymous messages against the real sender
   - A mafia player cannot bypass rate limits by switching between anonymous and named messages
   - The rate limit check uses the real `senderId` (not the alias) for counting

---

## Issue 2 — Anonymous Send Toggle in Chat UI

**Problem:** Mafia players need a way to choose between sending as themselves or as "MAFIA" in the public chat.

**Requirement:** When a mafia player is on the public chat tab, show a toggle to switch between "Send as you" and "Send as MAFIA". The toggle is not visible to non-mafia players.

### Frontend Sub-Tasks

6. Add an anonymous mode toggle to the `ChatInput` component:
   - Only rendered when the current player's role is `"mafia"` AND the active channel is `"public"`
   - Toggle switch or segmented button with two options:
     - "You" (default) — shows the player's own avatar and name
     - "MAFIA" — shows a mask/incognito icon and the alias "MAFIA"
   - The toggle sits above or inline with the text input, clearly indicating which identity will be used
   - State: `isAnonymous: boolean` (local state, defaults to `false`)

7. Pass the `anonymous` flag when calling `sendChatMessage`:
   - When `isAnonymous` is `true`, include `anonymous: true` in the mutation args
   - When `false` or on the mafia channel, omit the flag (default behavior)

8. Visual confirmation in the input area:
   - When anonymous mode is active, change the input border or background to a subtle danger/red tint to remind the player they are in anonymous mode
   - Show a small label: "Sending as MAFIA" / "الإرسال كمافيا"

---

## Issue 3 — Anonymous Message Rendering

**Problem:** Anonymous messages need a distinct visual treatment in the chat timeline so players recognize them as anonymous communications from the Mafia.

**Requirement:** Messages sent anonymously display with the "MAFIA" alias, a distinct visual style, and no avatar. Other players cannot determine which specific mafia member sent the message.

### Frontend Sub-Tasks

9. Update the `ChatPanel` message row rendering:
   - When `isAnonymous === true`:
     - Show "MAFIA" as the sender name in a danger/red color (matching mafia faction styling)
     - Replace the avatar with a mafia icon (e.g. a mask icon `🎭` or a material icon like `person_off` / `visibility_off`)
     - Add a subtle dark/danger background tint to the message row to make it visually distinct
   - When `isAnonymous` is `false` or absent:
     - Existing behavior: show real avatar and username

10. Handle anonymous messages in the mafia chat perspective:
    - Anonymous messages should NOT appear in the mafia channel (they are public-only)
    - No special handling needed for the mafia channel tab

11. Ensure template messages support anonymous mode:
    - When a mafia player uses a predefined template (from `TemplatePickerPopover`) while in anonymous mode, the message is sent with both `templateKey` and `anonymous: true`
    - The rendered template message shows "MAFIA" as the sender, same as free-text anonymous messages

---

## Issue 4 — Security & Anti-Cheat

**Problem:** Anonymous messaging introduces a risk: if the implementation leaks any identifying information, mafia players' covers are blown. Additionally, non-mafia players must not be able to spoof anonymous messages.

**Requirement:** Server-side enforcement ensures only mafia can send anonymous messages, and no identifying data is ever returned to non-mafia players for anonymous messages.

### Backend Sub-Tasks

12. Server-side role validation (defense in depth):
    - Even if the frontend hides the toggle for non-mafia, the backend MUST reject `anonymous: true` from non-mafia players
    - Validate the player's role from the `players` table, not from any client-supplied value
    - Throw `ConvexError("ANONYMOUS_NOT_ALLOWED")` with a generic message (don't confirm or deny the player's role in the error)

13. Audit the `getChatMessages` query response shape:
    - For anonymous public messages, the returned object must be:
      ```ts
      {
        senderId: null,           // no real sender ID
        senderUsername: "MAFIA",  // alias only
        content: "...",
        isAnonymous: true,
        anonymousAlias: "MAFIA",
        timestamp: number,
        // realSenderId is NEVER included
      }
      ```
    - Verify that no Convex system fields (like `_creationTime`) or other metadata can be correlated to identify the sender
    - If multiple mafia members send anonymous messages, they must be indistinguishable from each other in the response

14. Prevent identity leakage via timing or ordering:
    - Anonymous messages must not be correlated with mafia channel activity
    - The `getChatMessages` query for the public channel must not expose any ordering metadata that would allow cross-referencing with mafia channel messages
    - This is already handled if public and mafia channels are queried independently (which they are per T25)

---

## Issue 5 — i18n & RTL

**Problem:** The anonymous alias "MAFIA" and related UI labels need to be translatable.

**Requirement:** All anonymous chat strings must support English and Arabic.

### Frontend Sub-Tasks

15. Add i18n keys for EN and AR:
    - `"chat.anonymous.alias"` → "MAFIA" / "مافيا"
    - `"chat.anonymous.sendAs"` → "Send as" / "أرسل كـ"
    - `"chat.anonymous.sendAsYou"` → "You" / "أنت"
    - `"chat.anonymous.sendAsMafia"` → "MAFIA" / "مافيا"
    - `"chat.anonymous.active"` → "Sending as MAFIA" / "الإرسال كمافيا"
    - `"chat.anonymous.notAllowed"` → "Only Mafia members can send anonymous messages" / "فقط أعضاء المافيا يمكنهم إرسال رسائل مجهولة"

16. Ensure the anonymous alias in stored messages uses the i18n key (`chat.anonymous.alias`) rather than a hardcoded string:
    - Store `anonymousAlias: "MAFIA"` as a constant in the DB (English canonical form)
    - The frontend renders it using `t("chat.anonymous.alias")` so Arabic users see "مافيا" and English users see "MAFIA"
    - This means `senderUsername` on anonymous messages is always the English form for storage consistency; the frontend localizes at display time

---

## Acceptance Criteria

- [ ] Mafia players can toggle between sending as themselves or as "MAFIA" in public chat
- [ ] Anonymous toggle is only visible to mafia players on the public channel
- [ ] Non-mafia players cannot send anonymous messages (server-side enforced)
- [ ] Anonymous messages display with "MAFIA" alias, distinct styling, and no real avatar
- [ ] No real sender identity (userId, username) is returned to the frontend for anonymous messages
- [ ] `realSenderId` is stored server-side for audit but never exposed in queries
- [ ] Rate limits count anonymous messages against the real sender
- [ ] Anonymous mode works with predefined template messages
- [ ] Multiple anonymous messages from different mafia members are indistinguishable
- [ ] Anonymous alias is localized (EN: "MAFIA", AR: "مافيا")
- [ ] All i18n keys added for EN and AR
- [ ] RTL layout renders anonymous messages correctly
- [ ] No regressions in existing chat functionality (public, mafia channels, permissions)
