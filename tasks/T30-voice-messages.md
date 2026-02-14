# T30 — Predefined Voice Messages

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P2 |
| **Complexity** | L |
| **Dependencies** | T25 |

## Description

Add a predefined voice message system where players can select and send short audio clips in the chat. When a voice message is sent, it is **broadcast to all players in the room** — the audio plays automatically on every player's device (not just in the chat stream). Voice clips are static files hosted under `web/public/audio/chat-voices/` and referenced by a key. The system reuses the existing chat infrastructure (T25) with a new message type.

---

## Issue 1 — Voice Clip Registry

**Problem:** Voice clips exist as raw files under `web/public/audio/chat-voices/` but there is no structured registry mapping them to display labels, i18n keys, or playback metadata.

**Requirement:** Define a typed registry of all available voice clips with display names, file paths, and categorization.

### Existing Voice Files

| File | Key | Label (AR) | Label (EN) |
|------|-----|-----------|-----------|
| `ya_patl.mp3` | `ya_patl` | يا باطل | You're wrong! |
| `7hl_3ne.mp3` | `7hl_3ne` | حلّ عني | Leave me alone |
| `lh_lh_lh.mp3` | `lh_lh_lh` | له له له | Ha ha ha |
| `lk_mbsoot.mp3` | `lk_mbsoot` | لك مبسوط | Are you happy? |
| `lk_3la_meen.mp3` | `lk_3la_meen` | لك على مين | Who are you targeting? |
| `laaa.mp3` | `laaa` | لاااا | Nooooo |

### Frontend Sub-Tasks

1. Create a `VOICE_CLIPS` registry constant in `lib/voice-clips.ts`:
   ```ts
   export const VOICE_CLIPS = [
     { key: "ya_patl",           file: "/audio/chat-voices/ya_patl.mp3",           labelKey: "voice.ya_patl" },
     { key: "7hl_3ne",           file: "/audio/chat-voices/7hl_3ne.mp3",           labelKey: "voice.7hl_3ne" },
     { key: "lh_lh_lh",          file: "/audio/chat-voices/lh_lh_lh.mp3",          labelKey: "voice.lh_lh_lh" },
     { key: "lk_mbsoot",         file: "/audio/chat-voices/lk_mbsoot.mp3",         labelKey: "voice.lk_mbsoot" },
     { key: "lk_3la_meen",       file: "/audio/chat-voices/lk_3la_meen.mp3",       labelKey: "voice.lk_3la_meen" },
     { key: "laaa",              file: "/audio/chat-voices/laaa.mp3",              labelKey: "voice.laaa" },
    
   ] as const;

   export type VoiceClipKey = (typeof VOICE_CLIPS)[number]["key"];
   ```
   - Each entry maps a key (used in chat messages) to a static file path and an i18n label key
   - New clips can be added by dropping a file and adding an entry — no backend changes needed

---

## Issue 2 — Chat Message Type for Voice

**Problem:** The `chatMessages` table (T25) only supports text content and template messages. There is no way to represent a voice message.

**Requirement:** Extend the chat message schema to support a voice message type that stores the voice clip key. The chat backend validates the key against the known registry.

### Schema Changes

3. Add fields to the `chatMessages` table in `schema.ts`:
   - `isVoice: v.optional(v.boolean())` — `true` when the message is a voice clip
   - `voiceClipKey: v.optional(v.string())` — the key from the `VOICE_CLIPS` registry (e.g. `"ya_patl"`)

### Backend Sub-Tasks

4. Define a server-side `VALID_VOICE_KEYS` constant in `chat.ts` (or a shared `lib/voiceClips.ts` under convex):
   - A simple set/array of valid voice clip keys: `["ya_patl", "7hl_3ne", "lh_lh_lh", "lk_mbsoot", "lk_3la_meen", "laaa", "adashri_reaction"]`
   - Used for validation only — the actual audio files are served statically from `/public/`

5. Modify the `sendChatMessage` mutation in `chat.ts`:
   - Accept optional `voiceClipKey: v.optional(v.string())` argument
   - **When `voiceClipKey` is provided:**
     - Validate the key exists in `VALID_VOICE_KEYS` — throw `ConvexError("INVALID_VOICE_CLIP")` if not
     - Set `isVoice: true` and `voiceClipKey` on the stored message
     - Set `content` to a fallback text representation (e.g. the i18n label key or `"🔊 Voice message"`) for display in contexts where audio can't play
     - All other validations still apply: rate limits, chat enabled, not muted, not eliminated, channel permissions
   - **When `voiceClipKey` is not provided:**
     - Existing behavior (text or template message)

6. Expose `isVoice` and `voiceClipKey` in the `getChatMessages` query response:
   - Return these fields as part of each message object
   - No special permission filtering needed — voice messages follow the same channel visibility rules as text messages

---

## Issue 3 — Auto-Play Broadcast to All Players

**Problem:** Voice messages must play automatically on all players' devices when sent, not just appear as a clickable element in the chat stream.

**Requirement:** When a new voice message arrives via the real-time Convex subscription, automatically play the audio clip on every player's device. Respect the user's music/sound preferences.

### Frontend Sub-Tasks

7. Create a `VoiceMessagePlayer` provider/hook in `components/providers/voice-message-player.tsx` (or `hooks/use-voice-broadcast.ts`):
   - Subscribe to the public chat messages query (existing `getChatMessages` subscription)
   - Track the last seen message ID/timestamp to detect new messages
   - When a new message with `isVoice === true` arrives:
     - Look up the `voiceClipKey` in the `VOICE_CLIPS` registry to get the file path
     - Create an `Audio` object and play it: `new Audio(filePath).play()`
     - Handle autoplay restrictions: if the browser blocks autoplay, queue the clip and play on the next user interaction (same pattern as background music in T23)
   - **Do NOT auto-play** if:
     - The user's `musicEnabled` preference is `false` (reuse the existing preference — voice and music share the same toggle, or see sub-task 11 for a separate toggle)
     - The chat panel is not available (user is not in a game)
   - Prevent duplicate plays: if the same message triggers multiple subscription updates, guard against replaying

8. Mount the `VoiceMessagePlayer` inside the game layout (alongside `BackgroundMusicProvider`):
   - It should be active whenever the user is in an active game
   - It does not depend on the chat panel being open — voice messages play even if the chat is closed

9. Handle volume and overlap:
   - Play voice messages at a higher volume than background music (e.g. voice at 0.8, music at 0.3)
   - If background music is playing, momentarily reduce its volume (duck) while the voice clip plays, then restore
   - If multiple voice messages arrive in quick succession, queue them and play sequentially (don't overlap)

---

## Issue 4 — Voice Message Picker UI

**Problem:** Players need a way to browse and send voice clips from the chat interface.

**Requirement:** Add a voice message picker accessible from the chat input area. Players can preview clips before sending and send with a single tap.

### Frontend Sub-Tasks

10. Create a `VoicePickerPopover` component in `components/game/voice-picker-popover.tsx`:
    - Triggered by a microphone icon button (`mic`) next to the chat input (alongside the existing template picker)
    - Displays a grid or list of available voice clips, each showing:
      - The localized label (from `t(clip.labelKey)`)
      - A small play/preview button to hear the clip before sending
      - A send button to dispatch the voice message
    - On send: call `sendChatMessage` with `voiceClipKey` and the active channel
    - Close the popover after sending
    - Preview playback: plays the clip locally only (does not send a message), at a lower volume

11. Integrate the `VoicePickerPopover` into the `ChatInput` component:
    - Add the mic icon button to the input toolbar (next to the template picker icon)
    - On mobile: popover as a bottom sheet with a scrollable list
    - On desktop: popover positioned above the input area

---

## Issue 5 — Voice Message Rendering in Chat Stream

**Problem:** Voice messages need a visual representation in the chat message list, distinct from text and template messages.

**Requirement:** Voice messages appear in the chat timeline with an audio player, the clip label, and the sender info.

### Frontend Sub-Tasks

12. Update the `ChatPanel` message row rendering for voice messages:
    - When `isVoice === true`:
      - Show the sender info (avatar + username) as normal
      - Replace the text content area with a compact inline audio element:
        - A play/pause button
        - The clip label (e.g. "يا باطل" / "You're wrong!")
        - A small speaker icon to indicate it's a voice message
      - Style with a distinct background (e.g. `bg-primary/10` with a waveform-like decorative element)
    - When tapped/clicked, replay the clip locally
    - Show the same relative timestamp as text messages

13. Handle anonymous voice messages (T29 interaction):
    - If a mafia player sends a voice message in anonymous mode, render the sender as "MAFIA" with the same styling as anonymous text messages
    - The voice clip plays the same regardless of anonymous mode

---

## Issue 6 — Sound Preferences

**Problem:** Some players may want background music but not voice message auto-play, or vice versa. Currently there is only a single `musicEnabled` toggle.

**Requirement:** Add a separate toggle for voice message auto-play, or use the existing `musicEnabled` toggle for both.

### Frontend Sub-Tasks

14. Decide on preference granularity (implement one of these approaches):
    - **Option A (simple, recommended for v1):** Reuse `musicEnabled` — when music is off, voice auto-play is also off. Players can still manually play clips from the chat timeline. No schema changes needed.
    - **Option B (granular):** Add a `voiceAutoPlayEnabled: v.optional(v.boolean())` field to the `users` table and a corresponding toggle in settings. This allows independent control.
    - Implement Option A for now; Option B can be added later if users request it

15. When auto-play is disabled:
    - Voice messages still appear in the chat timeline with the inline player
    - The auto-play broadcast is suppressed — the clip does NOT play automatically
    - Players can tap the play button in the chat row to hear it manually

---

## Issue 7 — i18n

**Problem:** Voice clip labels and related UI strings need to support English and Arabic.

**Requirement:** All voice-related strings must be translatable.

### Frontend Sub-Tasks

16. Add i18n keys for EN and AR:
    - Voice clip labels:
      - `"voice.ya_patl"` → "You're wrong!" / "!يا باطل"
      - `"voice.7hl_3ne"` → "Leave me alone" / "حلّ عني"
      - `"voice.lh_lh_lh"` → "Ha ha ha" / "له له له"
      - `"voice.lk_mbsoot"` → "Are you happy?" / "لك مبسوط؟"
      - `"voice.lk_3la_meen"` → "Who are you targeting?" / "لك على مين؟"
      - `"voice.laaa"` → "Nooooo" / "لاااا"
    - UI chrome:
      - `"voice.picker.title"` → "Voice Messages" / "الرسائل الصوتية"
      - `"voice.picker.preview"` → "Preview" / "معاينة"
      - `"voice.picker.send"` → "Send" / "إرسال"
      - `"voice.message.fallback"` → "Voice message" / "رسالة صوتية"
      - `"voice.autoplay.blocked"` → "Tap anywhere to enable sound" / "انقر في أي مكان لتفعيل الصوت"

---

## Acceptance Criteria

- [ ] All voice files have URL-safe filenames under `web/public/audio/chat-voices/`
- [ ] `VOICE_CLIPS` registry maps keys to file paths and i18n labels
- [ ] `chatMessages` schema supports `isVoice` and `voiceClipKey` fields
- [ ] `sendChatMessage` validates voice clip keys server-side against a known set
- [ ] Voice messages play automatically on all players' devices when sent
- [ ] Auto-play respects the user's sound preference (`musicEnabled`)
- [ ] Auto-play handles browser restrictions gracefully (queue and retry on interaction)
- [ ] Background music volume ducks during voice clip playback
- [ ] Multiple voice clips queue sequentially (no overlap)
- [ ] Voice picker UI allows previewing clips before sending
- [ ] Voice messages render in the chat timeline with an inline audio player
- [ ] Voice messages work with anonymous mode (T29) — sender shown as "MAFIA"
- [ ] Rate limits apply equally to voice messages
- [ ] All i18n keys added for EN and AR
- [ ] Mobile-friendly picker layout (bottom sheet)
- [ ] No regressions in existing chat or audio functionality
