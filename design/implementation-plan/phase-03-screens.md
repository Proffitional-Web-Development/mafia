# Phase 03 — Screen-Level Layout & Composition

> **Goal:** Assemble every screen using Phase 2 components, matching the layout and visual composition documented in `/design-analysis/screens/`. Preserve all existing Convex queries/mutations and game logic — only the presentation layer changes.

> **Depends on:** Phase 01 (design system), Phase 02 (all reusable components built).

---

## Guiding Principles

1. **Preserve all game logic.** Every Convex query, mutation, subscription, and state check in the existing code stays. Only JSX structure and Tailwind classes change.
2. **Swap old components for new.** Replace `Button` → `PrimaryButton`/`SecondaryButton`, inline cards → `PlayerCard`, inline graveyard → `GraveyardSheet`, etc.
3. **Delete deprecated components** after all consumers are migrated.
4. **Each screen is independently assignable** — there are no cross-screen UI dependencies beyond shared components (already built in Phase 2).

---

## Screen Migration Map

### Group A — Pre-Game Screens (no Convex game state)

These screens can be migrated **in parallel**:

---

#### 3.1 — Login / Signup Screen

**Existing file:** `app/[locale]/auth/page.tsx`
**Design spec:** `design-analysis/screens/login-signup.md`

**Current state:** Functional auth form (email input, password input, sign-in/sign-up toggle, Google OAuth button). Uses `Button`, plain HTML inputs, no visual styling.

**Migration scope:**
- Replace `<input>` elements with `TextInput` (codename w/ `@` icon, password w/ `vpn_key` icon + visibility toggle)
- Replace `Button` with `PrimaryButton` ("Enter the Den" w/ `login` icon)
- Add `SecondaryButton (oauth)` for Google sign-in
- Add `SecondaryButton (text-link)` for "Create Account" toggle
- Add `Divider` ("OR" separator)
- Add decorative background layer (blur blobs, scanline overlay)
- Add fingerprint icon header (`w-24 h-24` circle with pulse ring)
- Container: `max-w-sm h-[100dvh]` with `overflow-y-auto no-scrollbar`

**Game logic preserved:** Auth flow (email/password + Google), redirect to `/onboarding` on success, already-logged-in redirect.

**Acceptance criteria:**
- [ ] Visual match to `design/login_singup_screen/code.html`
- [ ] Auth flow still works end-to-end
- [ ] Scanline effect renders
- [ ] Login ↔ Signup toggle works

---

#### 3.2 — Username Selection Screen

**Existing file:** `app/[locale]/onboarding/page.tsx`
**Design spec:** `design-analysis/screens/username-selection.md`

**Current state:** Functional username input + avatar upload in one page. No step indicator, no suggested chips, basic styling.

**Migration scope:**
- Split into Step 1 (username) and Step 2 (avatar) — either as separate routes or stepper within the page
- Add `StepIndicator` (step 1 of 3)
- Replace input with `TextInput` (character counter, validation check icon)
- Add `SuggestedChips` component
- Add fingerprint icon header (same as login)
- Replace `Button` with `PrimaryButton` ("Join the Family" w/ `arrow_forward` icon)
- Add decorative background (blur blobs, scanlines)
- Add legal text link at bottom

**Game logic preserved:** Username validation (3–24 chars, alphanumeric + underscore), `completeProfile` mutation, redirect to `/game`.

**Decision required:** Should this be split into 2 routes (`/onboarding/username` + `/onboarding/avatar`) or remain a single page with internal stepper state?

**Acceptance criteria:**
- [ ] Visual match to `design/username_selection_screen/code.html`
- [ ] Character counter shows `N/24` and validates in real-time
- [ ] Suggested chips populate and fill input on tap
- [ ] Step indicator shows step 1 of 3

---

#### 3.3 — Avatar Selection Screen

**Existing file:** `app/[locale]/onboarding/page.tsx` (same page, if splitting)
**Design spec:** `design-analysis/screens/avatar-selection.md`

**Current state:** Avatar upload exists in onboarding page but no preset grid. Only file-upload via Convex storage.

**Migration scope:**
- Large `AvatarCircle (glow-wrapper)` preview with edit badge
- `SecondaryButton (outline)` for "Upload Photo"
- Preset icon grid (4x2) using Material Icons — `face_6`, `local_police`, `visibility`, etc.
- `PrimaryButton` ("Complete Profile" w/ `arrow_forward`)
- "Skip for now" in header
- `StepIndicator` (step 2 of 3)

**New data needed:** Preset avatar icon list (can be a static array in the component or a shared constant).

**Acceptance criteria:**
- [ ] Visual match to `design/avatar_selection_screen/code.html`
- [ ] File upload still works via Convex storage
- [ ] Preset icons selectable with visual feedback
- [ ] "Skip for now" bypasses avatar and navigates to game

---

#### 3.4 — Home Screen

**Existing file:** `app/[locale]/page.tsx`
**Design spec:** `design-analysis/screens/home-screen.md`

**Current state:** Basic centered card with title, description, CTA button, language switcher, user avatar.

**Migration scope:**
- Apply `data-theme="mafia"` (red theme) on this page's container
- Full-bleed background image (noir smoke) with `mix-blend-overlay`
- Logo section: "Mafia **Game**" in `text-5xl font-black`, "Trust No One" tagline
- Hero illustration card with grayscale → color hover effect
- `UserStatusCard` floating on hero image
- `PrimaryButton (danger)` "Go to Game"
- Online player count below CTA
- `BottomNavigation` (Home tab active)
- `LanguageSwitcher (pill)` in header

**Font override:** This screen uses `Be Vietnam Pro` (`font-display-alt`). Apply via top-level class.

**Game logic preserved:** User query, auth-based destination switching, locale routing.

**Acceptance criteria:**
- [ ] Visual match to `design/mafia_game_home_screen/code.html`
- [ ] Red/mafia theme applies (bg, buttons, accents)
- [ ] Be Vietnam Pro font used for text
- [ ] Bottom navigation renders with Home tab active
- [ ] Language switcher as pill toggle

---

#### 3.5 — Join or Create Room Lobby

**Existing file:** `app/[locale]/game/page.tsx`
**Design spec:** `design-analysis/screens/join-create-lobby.md`

**Current state:** Functional create/join form. Uses `Button`, plain input for room code.

**Migration scope:**
- User header (avatar + name + online dot)
- "Start **Playing**" gradient-text title
- Create Room hero card (full-width, image background, add icon, shine effect)
- `Divider` ("OR JOIN" text variant)
- Join section card with `TextInput (code)` + `SecondaryButton (outline)`
- `BottomNavigation` (Lobby tab active)
- Background blur blobs

**Game logic preserved:** `createRoom` mutation, `joinRoom` mutation, room code validation, navigation to `/game/room/[roomId]`.

**Acceptance criteria:**
- [ ] Visual match to `design/join_or_create_room_lobby/code.html`
- [ ] Create room + join room flows work
- [ ] Room code input auto-uppercases and monospace-styled
- [ ] Bottom navigation renders

---

### Group B — Room & Pre-Game Phase

---

#### 3.6 — Room Lobby Waiting Area

**Existing file:** `app/[locale]/game/room/[roomId]/page.tsx` (LobbyView section ~395 lines)
**Design spec:** `design-analysis/screens/room-lobby.md`

**Current state:** Functional lobby with player list (owner badges, kick buttons), room code, settings sliders, start/leave buttons. All inline, ~395 lines.

**Migration scope:**
- Extract `SettingsPanel` usage (built in Phase 2)
- Logo/brand header (`casino` icon + "Mafia Night")
- `RoomCodeCard` with copy button
- 4-col `PlayerGrid` with `PlayerCard (lobby)` variants (host, self, empty dashed slots)
- Participants header with `Badge (player-count)` — "4/12 Joined"
- `PrimaryButton` "Start Game" / "Waiting for players..." (disabled state)
- `SecondaryButton (danger-text)` "Leave Room"
- Centered italic quote

**Game logic preserved:** Room subscription, kick player, update settings, start game (≥3 players), leave room, owner-only controls.

**Acceptance criteria:**
- [ ] Visual match to `design/room_lobby_waiting_area/code.html`
- [ ] Owner controls (settings, kick, start) work
- [ ] Real-time player join/leave updates
- [ ] Room code copy works

---

#### 3.7 — Role Reveal Phase

**Existing file:** `components/game/role-reveal-phase.tsx`
**Design spec:** `design-analysis/screens/role-reveal.md`

**Current state:** Shows `RoleCard` (old) with mafia teammates list and "I'm Ready" button.

**Migration scope:**
- Replace `RoleCard` with new `RoleRevealCard` (3D flip)
- `Badge (phase)` "Card Distribution" with green dot
- "Tap card to reveal role" instruction with `animate-pulse`
- `PrimaryButton` "I AM READY" appears after flip with `delay-300` fade-in
- Background: blur blobs + dot grid pattern
- Mafia teammate list (conditional) below card

**Game logic preserved:** `getMyRole` query, `getMafiaTeammates` query, `advancePhase` mutation.

**Acceptance criteria:**
- [ ] 3D card flip animation works
- [ ] Role info (icon, name, team, description) displays correctly
- [ ] "I AM READY" appears only after card is flipped
- [ ] Mafia players see teammate list

---

### Group C — Game Phase Screens

These are the most logic-dense screens. Each preserves its existing Convex query/mutation wiring.

---

#### 3.8 — Discussion Phase

**Existing file:** `components/game/discussion-phase.tsx`
**Design spec:** `design-analysis/screens/discussion-phase.md`

**Migration scope:**
- `PhaseHeader (discussion)` with "Discussion Round N", `TimerDisplay (circle)` with pulse ring
- `Badge (status)` "Live Phase", "Global Chat"
- 2-col `PlayerGrid` with `PlayerCard` variants: `speaking`, `self`, `game-phase`
- `PrimaryButton (outline)` "End Discussion Early" with `gavel` icon (owner-only)
- `GraveyardSheet` at bottom
- Background blur blobs

**Game logic preserved:** `getDiscussionState` query, `skipDiscussion` mutation, timer sync, owner check.

---

#### 3.9 — Public Voting Phase

**Existing file:** `components/game/public-voting-phase.tsx`
**Design spec:** `design-analysis/screens/public-voting.md`

**Migration scope:**
- `PhaseHeader (voting)` with "Public Execution", `TimerDisplay (inline)` with urgent red pulse, progress bar
- 2-col `PlayerGrid` with `PlayerCard (voting)` — vote count badges + stacked voter avatars
- `SecondaryButton (dashed)` "Skip Vote"
- `PrimaryButton` "Confirm Results" (owner-only)
- `BottomActionBar` with gradient fade

**Game logic preserved:** `getPublicVotes` query, `castPublicVote` mutation, `confirmVoting` mutation, vote change, skip.

---

#### 3.10 — Mafia Voting Phase

**Existing file:** `components/game/mafia-voting-phase.tsx`
**Design spec:** `design-analysis/screens/mafia-voting.md`

**Migration scope:**
- Apply `data-theme="mafia"` (red theme)
- `PhaseHeader (mafia-night)` with moon icon, red styling
- 2-col `PlayerGrid` with `PlayerCard (mafia-target)` — full-image, grayscale → color, crosshair
- Teammate vote indicators (`Badge`)
- Floating chat FAB with notification dot
- `PrimaryButton (danger)` "Confirm Kill on [Name]" with shimmer
- Privacy warning text in `BottomActionBar`
- `WaitingOverlay` for non-mafia (moon + "The night is quiet...")
- Crosshair background pattern

**Game logic preserved:** `getMafiaVotes` query, `castMafiaVote` mutation, `confirmMafiaVoting` mutation, non-mafia waiting state.

---

#### 3.11 — Sheikh Night Ability Phase

**Existing file:** `components/game/ability-phase.tsx` (sheikh section)
**Design spec:** `design-analysis/screens/sheikh-ability.md`

**Migration scope:**
- `PhaseHeader (ability-left)` with "Sheikh" + star icon, `TimerDisplay (ring)` right-aligned
- Instruction section with action pill badge
- 3-col `PlayerGrid` with `PlayerCard (ability)` — compact cards, dead disabled
- `InvestigationLog` glass panel (extract from inline rendering)
- `PrimaryButton` "INVESTIGATE @Name" with `search` icon
- `WaitingOverlay` for non-sheikh players

**Game logic preserved:** `getAbilityPhaseState` query, `useSheikhAbility` mutation, history rendering.

---

#### 3.12 — Girl Protection Ability Phase

**Existing file:** `components/game/ability-phase.tsx` (girl section)
**Design spec:** `design-analysis/screens/girl-protection.md`

**Migration scope:**
- `PhaseHeader (ability-split)` with floating role badge, split title/timer
- `Badge (role)` "The Girl" with `local_hospital` icon, `animate-float`
- 2-col `PlayerGrid` with `PlayerCard (protection)` — green border, shield icon, grayscale → color
- Dead player "Eliminated" overlay
- `PrimaryButton` "Protect [Name]" with `local_hospital` icon
- Success modal overlay (spinning check + "Protection Submitted")
- `WaitingOverlay` for non-girl players

**Game logic preserved:** `getAbilityPhaseState` query, `useGirlAbility` mutation, confirmation state.

**Note:** Currently sheikh and girl share `ability-phase.tsx`. Consider splitting into `sheikh-ability-view.tsx` and `girl-protection-view.tsx` for clarity, while keeping the router in `ability-phase.tsx`.

---

#### 3.13 — Boy Revenge Phase

**Existing file:** `components/game/resolution-phase.tsx` (boy revenge section)
**Design spec:** `design-analysis/screens/boy-revenge.md`

**Migration scope:**
- Apply `data-theme="mafia"` (red theme)
- Vignette border (`border-[8px] border-primary/20 rounded-[40px]`)
- `TimerDisplay (ring)` centered, `w-20 h-20`
- "Last Revenge!" title
- 2-col `PlayerGrid` with `PlayerCard` + crosshair (`my_location`) overlay on selected
- `PrimaryButton (danger)` "USE REVENGE" with `gavel` icon
- "IRREVERSIBLE ACTION" warning
- `WaitingOverlay` for non-Boy players

**Game logic preserved:** `getResolutionState` query, `useBoyRevenge` mutation, 30s timer.

**Note:** Consider extracting boy revenge view from `resolution-phase.tsx` into `RevengePanel` or a dedicated view component.

---

#### 3.14 — Morning Resolution Phase

**Existing file:** `components/game/resolution-phase.tsx` (main section)
**Design spec:** `design-analysis/screens/morning-resolution.md`

**Migration scope:**
- Sun icon header in yellow circle + "Morning has broken" title with text glow
- `EliminationCard` (avatar, name, "was eliminated by the **Mafia**")
- `RevengePanel` (conditional, if boy was eliminated)
- 4-col `PlayerGrid` with survivor status cards (alive/dead/self/new-dead variants)
- Progress bar at bottom ("Preparing next phase... 75%")
- "No one was eliminated" alternative state

**Game logic preserved:** `getResolutionState` query, elimination data, boy revenge conditional.

---

#### 3.15 — Game Over / Results Screen

**Existing file:** `components/game/finished-phase.tsx`
**Design spec:** `design-analysis/screens/game-over.md`

**Migration scope:**
- Winner announcement header (gradient text, faction icon in `w-24 h-24` circle)
- Personal result card (role icon, win/lose, team summary) — glass panel
- Scrollable game report table using `GameReportRow` (4 variants)
- `PrimaryButton` "Play Again" (owner)
- `SecondaryButton (ghost)` "Leave Game"
- `BottomActionBar` with backdrop blur

**Game logic preserved:** Game results query, `playAgain` mutation, leave room, role reveals.

---

## Migration Checklist (All Screens)

After all screen migrations are complete:

- [ ] Delete deprecated components:
  - `components/ui/button.tsx` (replaced by `PrimaryButton` + `SecondaryButton`)
  - `components/ui/role-card.tsx` (replaced by `RoleRevealCard`)
  - `components/ui/phase-timer.tsx` (replaced by `TimerDisplay`)
  - `components/ui/player-avatar.tsx` (replaced by `AvatarCircle` + `PlayerCard`)
  - `components/ui/vote-button.tsx` (replaced by `PlayerCard (voting)`)
  - `components/user-avatar.tsx` (replaced by `AvatarCircle`, or kept as internal dep of `AvatarCircle`)
- [ ] Remove `lucide-react` from `package.json` if no longer used
- [ ] Verify no dead imports remain (`typecheck` + `lint`)
- [ ] Run full app smoke test (create account → onboarding → create room → play game → game over)

---

## Parallelism

| Group | Screens | Can parallelize |
|---|---|---|
| **A** | 3.1 Login, 3.2 Username, 3.3 Avatar, 3.4 Home, 3.5 Join/Create | ✅ All 5 screens independent |
| **B** | 3.6 Room Lobby, 3.7 Role Reveal | ✅ Independent |
| **C** | 3.8–3.15 Game Phases | ✅ All 8 screens independent (each is a separate component file) |

**All 15 screens can run in parallel** since they only depend on Phase 2 components (built already) and don't share UI state.

---

## Risks & Ambiguities

| Risk | Mitigation |
|---|---|
| Splitting `ability-phase.tsx` into sheikh/girl views may break the `GameRouter` switch logic | Keep `ability-phase.tsx` as the router; new files are view-only children |
| Extracting `RevengePanel` from `resolution-phase.tsx` requires careful state management | Panel is presentational only; timer and mutation state stay in parent |
| Onboarding split (1 page → 2 steps) changes routing structure | Decide: internal stepper state vs. `/onboarding/username` + `/onboarding/avatar` sub-routes |
| Home screen background image asset not provided in design-analysis | Use placeholder; flag for design team to supply final asset |
| Game phase screens have 100–400 lines of logic interleaved with JSX | Migrate JSX only; extract logic hooks if needed for clarity but don't refactor backend calls |

---

## Files Changed (Summary)

| Action | Files |
|---|---|
| **Major rewrite** | `app/[locale]/auth/page.tsx`, `app/[locale]/onboarding/page.tsx`, `app/[locale]/page.tsx`, `app/[locale]/game/page.tsx`, `app/[locale]/game/room/[roomId]/page.tsx` |
| **Major rewrite** | `components/game/role-reveal-phase.tsx`, `components/game/discussion-phase.tsx`, `components/game/public-voting-phase.tsx`, `components/game/mafia-voting-phase.tsx`, `components/game/ability-phase.tsx`, `components/game/resolution-phase.tsx`, `components/game/finished-phase.tsx` |
| **Possibly new** | `components/game/sheikh-ability-view.tsx`, `components/game/girl-protection-view.tsx`, `components/game/boy-revenge-view.tsx` (extracted views) |
| **Delete** | `button.tsx`, `role-card.tsx`, `phase-timer.tsx`, `player-avatar.tsx`, `vote-button.tsx` (after migration confirmed) |
