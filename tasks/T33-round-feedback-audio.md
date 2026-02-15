# T33 — Round Feedback & Audio Experience

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P2 |
| **Complexity** | L |
| **Dependencies** | T14, T22, T23 |

## Description

Enhance the game experience with two features: (1) a round summary popup shown at the end of each round summarizing what happened (eliminations, actions), and (2) phase-aware audio cues that play short sound effects at the start of each game phase. Both features integrate with the existing `BackgroundMusicProvider` (T23) and respect the user's `musicEnabled` preference.

---

## Issue 1 — Round Summary Popup

**Problem:** When a round ends and transitions from `resolution` → `discussion` (next round), players have no consolidated view of what happened during the round. Events are logged in the game event timeline, but players may miss them — especially on mobile where the timeline panel may be closed.

**Requirement:** Show a modal popup at the end of each round summarizing all significant events: voting eliminations, mafia eliminations, boy revenge kills, and sanitized ability outcomes (role-specific). The modal must not leak private information (e.g., Sheikh investigation results should only be visible to the Sheikh).

### Backend Sub-Tasks

1. Create a `getRoundSummary` query in `web/convex/gameEvents.ts`:
   - Args: `{ gameId: v.id("games"), round: v.number() }`
   - Fetch all `gameEvents` for the given `gameId` and `round` using the `by_gameId_round` index
   - Apply the same sanitization as `getGameEvents`: use `getPublicMessageKey()` and `sanitizePublicParams()` to strip private information (Sheikh investigation specifics, etc.)
   - Return events sorted by timestamp (ascending — chronological order)
   - Auth check: require the requesting user to be a player in the game

2. Add role-specific detail enrichment to `getRoundSummary`:
   - Check the requesting player's role via the `players` table
   - If the player is a Sheikh: include unsanitized `SHEIKH_INVESTIGATION_CITIZEN` / `SHEIKH_INVESTIGATION_MAFIA` events (they already know their own investigation result)
   - If the player is a Girl: include a `GIRL_PROTECTION` marker if a protection action was recorded for this round in the `actions` table
   - All other players only see the public-safe events
   - This ensures each player sees a personalized but non-leaking summary

### Frontend Sub-Tasks

3. Create a `RoundSummaryModal` component in `web/components/game/round-summary-modal.tsx`:
   - Props: `gameId`, `round`, `open`, `onClose`
   - Calls `getRoundSummary` query to fetch round events
   - Displays:
     - Round number as the title (e.g. "Round 2 Summary")
     - A list of events in chronological order, each showing:
       - An icon representing the event type (skull for elimination, shield for protection, eye for investigation)
       - The localized event message (using `messageKey` and `messageParams` with `useTranslations("events")`)
     - A "Continue" button that dismisses the modal
   - Styling: dark modal overlay consistent with `PhaseFlash` (`bg-black/40 backdrop-blur-sm`), card-style content area

4. Integrate `RoundSummaryModal` into `GameRouter` (`web/components/game/game-router.tsx`):
   - Track `showRoundSummary` state and the round number to display
   - Detect round transitions: when `game.round` increments (previous round ended), show the summary for the previous round
   - Use a `useEffect` that watches `game.round` — when it changes from N to N+1, set `showRoundSummary = true` and `summaryRound = N`
   - Do NOT show for round 1 start (no previous round to summarize)
   - Do NOT show for `finished` phase (the finished screen handles end-of-game info)
   - The modal blocks interaction until the player taps "Continue"

5. Handle edge cases:
   - If the round summary has zero events (unlikely but possible), show a "Nothing happened" fallback message
   - If the player joined mid-game and missed the round, still show available events
   - On mobile: ensure the modal is scrollable if the event list is long

---

## Issue 2 — Phase-Aware Audio Cues

**Problem:** Phase transitions are only communicated visually through the `PhaseFlash` overlay (a 2-second text banner). There are no audio cues to signal phase changes, making it easy for players to miss transitions — especially when the app is in the background or the player is not actively looking at the screen.

**Requirement:** Play a short audio cue (5–10 seconds) at the start of each major game phase. Audio cues are distinct per phase to help players recognize the current phase by sound alone.

### Audio Files Required

6. Add phase audio cue files to `web/public/audio/phases/`:
   - `discussion.mp3` — calm/neutral tone, signals start of discussion
   - `publicVoting.mp3` — tense/dramatic tone, signals voting has begun
   - `abilityPhase.mp3` — mysterious/dark tone, signals night abilities
   - `mafiaVoting.mp3` — ominous/suspenseful tone, signals mafia deliberation
   - `resolution.mp3` — reveal/dramatic tone, signals results are coming
   - Each file should be 5–10 seconds, under 500KB, and fade out naturally
   - Format: MP3 (broad browser support)

### Frontend Sub-Tasks

7. Create a phase audio cue map in `web/lib/phase-audio.ts`:
   ```ts
   export const PHASE_AUDIO: Partial<Record<GamePhase, string>> = {
     discussion: "/audio/phases/discussion.mp3",
     publicVoting: "/audio/phases/publicVoting.mp3",
     abilityPhase: "/audio/phases/abilityPhase.mp3",
     mafiaVoting: "/audio/phases/mafiaVoting.mp3",
     resolution: "/audio/phases/resolution.mp3",
   };
   ```
   - Only phases with meaningful transitions have audio — `lobby`, `cardDistribution`, `endCheck`, and `finished` do not

8. Extend `BackgroundMusicProvider` in `web/components/providers/background-music-provider.tsx` to support phase cue playback:
   - Accept an optional `currentPhase` prop (or use a new context/hook approach)
   - When `currentPhase` changes and `musicEnabled` is `true`:
     - Look up the audio file from `PHASE_AUDIO`
     - If found, create an `Audio` object and play the cue at volume 0.7
     - Duck the background music volume from 0.3 → 0.1 while the cue plays, restore after
   - If `musicEnabled` is `false`, skip playback entirely
   - Prevent overlapping cues: if a new phase starts before the previous cue finishes, fade out the previous cue (500ms fade) then play the new one
   - Handle autoplay restrictions: queue the cue and play on next user interaction (same pattern as existing background music)

9. Pass `currentPhase` to `BackgroundMusicProvider` from the game layout:
   - The provider needs to know the current phase — either:
     - Option A: Pass it as a prop from the game page that has access to `gameState`
     - Option B: Create a `GamePhaseContext` that `BackgroundMusicProvider` reads from
   - Option A is simpler and recommended for v1

---

## Issue 3 — Audio Settings

**Problem:** Players need to be able to disable audio cues without affecting the overall game experience.

**Requirement:** Reuse the existing `musicEnabled` preference (T23) as a single toggle for all game audio (background music + phase cues + voice messages). A granular split can be added later if users request it.

### Frontend Sub-Tasks

10. Verify the existing `musicEnabled` toggle in the Settings page (T23) controls all audio:
    - Background music playback (already implemented)
    - Phase audio cues (from Issue 2)
    - Voice message auto-play (T30)
    - All three should check `user.musicEnabled` before playing

11. Add a quick audio toggle to the game header in `PhaseHeader`:
    - A small speaker icon (muted/unmuted) that toggles `musicEnabled` without leaving the game
    - Calls the existing `toggleMusic` mutation in `web/convex/users.ts`
    - Visual states: speaker icon when enabled, muted speaker icon when disabled
    - Position: in the header action buttons area (alongside chat and log toggles)

---

## Issue 4 — Sync Audio with Visual Phase Transition

**Problem:** The `PhaseFlash` component in `web/components/game/phases/phase-transition-controller.tsx` shows a 2-second visual overlay when the phase changes. The audio cue should be synchronized with this visual transition for a cohesive experience.

**Requirement:** Trigger the phase audio cue at the same moment the `PhaseFlash` visual appears, creating a unified audio-visual phase transition.

### Frontend Sub-Tasks

12. Trigger phase audio from `PhaseTransitionController`:
    - `PhaseFlash` remounts on each phase change (via `key={phase}`) — use a `useEffect` in `PhaseFlash` to trigger the audio cue on mount
    - Import the `PHASE_AUDIO` map and play the corresponding file
    - Check `musicEnabled` before playing (access via the user query or a context)
    - This ensures the audio and visual are perfectly synchronized

13. Prevent duplicate audio triggers:
    - If `BackgroundMusicProvider` also plays phase cues (from Issue 2), there would be duplicate playback
    - Choose ONE trigger point: either `BackgroundMusicProvider` (reacts to phase prop changes) OR `PhaseTransitionController` (reacts to remount)
    - **Recommended:** Use `PhaseTransitionController` as the sole trigger point for phase cues, since it already handles the visual transition and remounts on phase changes. Remove phase cue logic from `BackgroundMusicProvider` if implemented there.
    - `BackgroundMusicProvider` continues to handle only background music and volume ducking

---

## Issue 5 — Round-End Audio Cue

**Problem:** When the round summary popup appears (Issue 1), there is no audio feedback to draw the player's attention.

**Requirement:** Play a distinct short audio cue when the round summary modal mounts, signaling that a round has completed and results are available.

### Frontend Sub-Tasks

14. Add a round-end audio file `web/public/audio/phases/roundEnd.mp3`:
    - Short chime or stinger sound (2–5 seconds)
    - Should feel conclusive/summarizing (not dramatic like phase cues)
    - Under 300KB, MP3 format

15. Play the round-end cue when `RoundSummaryModal` mounts:
    - In `RoundSummaryModal`, add a `useEffect` on mount:
      - Check `musicEnabled` preference
      - If enabled, play `/audio/phases/roundEnd.mp3` at volume 0.6
      - Duck background music volume while the cue plays
    - Only plays once per round summary (guard against re-renders)

---

## Issue 6 — Audio File Sourcing & Credits

**Problem:** The game needs royalty-free audio files for phase cues, round-end chime, and background ambient music. The `game-ambient.mp3` file referenced by `BackgroundMusicProvider` does not currently exist (`web/public/audio/game-ambient.mp3` is missing).

**Requirement:** Source appropriate royalty-free audio files and add proper attribution.

### Sub-Tasks

16. Source audio files from royalty-free libraries (recommended sources):
    - [Pixabay](https://pixabay.com/sound-effects/) — CC0 / Pixabay License (free, no attribution required)
    - [Freesound](https://freesound.org/) — various CC licenses
    - [Mixkit](https://mixkit.co/free-sound-effects/) — free license
    - Requirements per file:
      - `game-ambient.mp3`: loopable ambient background, 1–3 minutes, ≤ 2MB
      - Phase cues (`discussion.mp3`, etc.): 5–10 seconds each, ≤ 500KB
      - `roundEnd.mp3`: 2–5 seconds, ≤ 300KB

17. Optimize audio files:
    - Compress to 128kbps MP3 (sufficient quality for short cues)
    - Ensure seamless looping for `game-ambient.mp3` (no click/pop at loop point)
    - Normalize volumes across all files for consistent playback levels

18. Create `web/public/audio/CREDITS.md` with attribution:
    - List each audio file with: filename, source URL, license, author (if applicable)
    - Example format:
      ```
      ## Audio Credits

      | File | Source | License | Author |
      |------|--------|---------|--------|
      | game-ambient.mp3 | pixabay.com/... | Pixabay License | username |
      | discussion.mp3 | pixabay.com/... | Pixabay License | username |
      ```

---

## Acceptance Criteria

- [ ] Round summary popup appears when transitioning from one round to the next
- [ ] Round summary shows voting eliminations, mafia eliminations, and boy revenge kills
- [ ] Sheikh sees their investigation result in the summary; other players do not
- [ ] Girl sees their protection action in the summary; other players do not
- [ ] Round summary does not appear on round 1 start or on game finish
- [ ] "Continue" button dismisses the round summary modal
- [ ] Phase audio cues play at the start of each phase (`discussion`, `publicVoting`, `abilityPhase`, `mafiaVoting`, `resolution`)
- [ ] Audio cues are synchronized with the `PhaseFlash` visual transition
- [ ] Background music volume ducks during audio cue playback
- [ ] No overlapping audio cues on rapid phase transitions
- [ ] Round-end audio cue plays when the round summary modal appears
- [ ] All audio respects the `musicEnabled` preference
- [ ] Quick audio toggle available in the game header
- [ ] `game-ambient.mp3` exists and loops seamlessly for background music
- [ ] All audio files are ≤ 500KB (cues) or ≤ 2MB (ambient), MP3 format
- [ ] `CREDITS.md` documents all audio sources and licenses
- [ ] No regressions in existing `BackgroundMusicProvider` or `PhaseTransitionController`
- [ ] All i18n keys added for EN and AR (round summary UI strings)
