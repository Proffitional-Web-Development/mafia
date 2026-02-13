# Mafia Game — Complete Product & Gameplay Behavior Specification

> **Purpose**: This document describes every user-facing behavior, system state, and edge case derived from the implemented codebase. It is the sole input for a UI/UX Designer who will not read any source code.
>
> **Date**: 2026-02-13  
> **Source of truth**: All behavior described here is derived from the running codebase — not from wish-lists or aspirational design docs.

---

## Table of Contents

1. [System-Derived Game Overview](#1-system-derived-game-overview)
2. [User & Account Lifecycle](#2-user--account-lifecycle)
3. [End-to-End User Journey](#3-end-to-end-user-journey)
4. [Gameplay Logic & State Flow](#4-gameplay-logic--state-flow)
5. [Data Models That Affect UX](#5-data-models-that-affect-ux)
6. [Progression, Rewards & Economy](#6-progression-rewards--economy)
7. [Errors, Edge Cases & Non-Happy Paths](#7-errors-edge-cases--non-happy-paths)
8. [Permissions, Constraints & Limits](#8-permissions-constraints--limits)
9. [Analytics & Events](#9-analytics--events)
10. [UX-Relevant Assumptions & Gaps](#10-ux-relevant-assumptions--gaps)

---

## 1. System-Derived Game Overview

### 1.1 Genre & Core Concept

A **real-time, multiplayer social deduction game** based on the Mafia/Werewolf archetype. Players are secretly assigned roles belonging to one of two factions (Mafia or Citizens). Citizens try to identify and eliminate Mafia members through discussion and voting. Mafia secretly eliminates Citizens each night.

### 1.2 Supported Platforms

- **Web-only** (Next.js application): desktop + mobile browsers.
- **Bilingual**: English (LTR) and Arabic (RTL). Language is switchable at any time via a dropdown.
- No native mobile apps exist.

### 1.3 Core Gameplay Loop (Per Round)

```
Discussion → Public Voting → Ability Phase (Night) → Mafia Voting → Resolution → Win Check
     ↑                                                                                 │
     └─────────────────────── Next Round (if no winner) ────────────────────────────────┘
```

### 1.4 Session Lifecycle

1. A user creates a Room (generates a 6-char code).
2. Other users join via the code.
3. Room owner starts the game when ≥ 3 players present.
4. Games consist of repeating rounds until a win condition is met.
5. After game ends, the room owner can trigger "Play Again" which resets the room to the waiting (lobby) state.

---

## 2. User & Account Lifecycle

### 2.1 Application Start Behavior

When a user opens the application:

1. The URL is resolved to a locale prefix (`/en/...` or `/ar/...`). If no locale prefix exists, the system redirects to the default locale (`en`).
2. The `<html>` element's `lang` and `dir` attributes are updated dynamically based on the active locale (`ltr` for English, `rtl` for Arabic).

### 2.2 Authentication Methods

Two authentication methods are implemented:

| Method | Flow |
|--------|------|
| **Email + Password** | User enters email and password. Supports both `signIn` and `signUp` flows via the same form (mode toggle). |
| **Google OAuth** | "Continue with Google" button. Redirects to Google, then back to `/onboarding`. |

- **No guest access**. The system explicitly displays "No guest access is allowed." Anonymous users cannot proceed beyond the home or auth pages.

### 2.3 Authentication State & Routing

| User State | Can Access | Redirected To |
|---|---|---|
| **Not authenticated** | Home page (`/`), Auth page (`/auth`) only | All other routes → `/auth` |
| **Authenticated, no profile** | All routes except game actions | Automatically redirected to `/onboarding` |
| **Authenticated, profile complete** | Everything | — |

The middleware enforces these rules server-side on every navigation.

### 2.4 Profile Completion (Onboarding)

After first authentication, the user must complete their profile:

- **Username** (required): 3–24 characters, alphanumeric + underscores only. Must be unique (case-insensitive check). Cannot be changed after initial setup (no edit mutation exists).
- **Avatar** (optional): File upload. Stored in Convex storage. If not provided, the system shows user initials.

A user is considered "profile complete" when `username` is set (i.e., `hasCompletedProfile = Boolean(user.username)`).

### 2.5 User Persistence

- Users are persisted in the Convex `users` table across sessions.
- Session tokens are managed by `@convex-dev/auth`. If a session expires, any API call requiring authentication throws `"Authentication required."` and the middleware redirects to `/auth`.
- Stats (gamesPlayed, wins, losses) persist permanently on the user record.

### 2.6 Edge Cases

| Scenario | System Behavior |
|---|---|
| Session token expired | Middleware redirects to `/[locale]/auth`. Backend throws `"Authentication required."` for any mutation/query. |
| Email already registered (signUp) | Auth provider returns error; frontend displays "Authentication failed." |
| Username already taken | `completeProfile` throws `"Username is already taken."` |
| Username too short/long | `completeProfile` throws `"Username must be between 3 and 24 characters."` |
| Invalid username characters | `completeProfile` throws `"Username can only include letters, numbers, and underscores."` |
| Avatar upload fails | Frontend catches and displays `"Avatar upload failed."` |

---

## 3. End-to-End User Journey

### 3.1 Home Page

**Trigger**: User navigates to `/` or `/{locale}`.

**Behavior**:
- Displays the game title ("Mafia Game") and a description.
- If the user is authenticated and has a profile, show their avatar + username in the header area.
- A single CTA button adapts its label:
  - Not authenticated → "Sign In / Sign Up" (navigates to `/auth`)
  - Authenticated, no profile → "Complete Profile" (navigates to `/auth`, which will auto-redirect to `/onboarding`)
  - Authenticated, profile complete → "Go to Game" (navigates to `/game`)
- A language switcher is always visible.

### 3.2 Authentication Page

**Trigger**: User navigates to `/auth` or is redirected by middleware.

**Behavior**:
- Displays a form with email and password fields.
- A mode toggle at the bottom: "Need an account? Create one" / "Already have an account? Sign in".
- A "Continue with Google" button for OAuth.
- On successful auth, the user is navigated to `/onboarding`.
- If the user is already authenticated, they are immediately redirected to:
  - `/game` if profile is complete.
  - `/onboarding` if profile is incomplete.

**Failure paths**:
- Invalid credentials → displayed as inline error text ("Authentication failed.").
- Google OAuth failure → "Google sign in failed."
- Network error → generic error message.

### 3.3 Onboarding Page

**Trigger**: User navigates to `/onboarding` after first auth.

**Behavior**:
- Shows a form with:
  - Username text input (required).
  - An avatar file picker (optional), with preview via `UserAvatar` component.
- On submit:
  1. `completeProfile` mutation is called with the username.
  2. If an avatar file was selected, a storage upload URL is generated, the file is uploaded, and then `setAvatarFromStorage` is called.
  3. On success, user is redirected to `/game`.
- If the user already has a complete profile, they are immediately redirected to `/game`.

### 3.4 Game Lobby Page (Create/Join)

**Trigger**: User navigates to `/game` with a complete profile.

**Behavior**:
- Displays two actions:
  1. **"Create Room"** button: calls `createRoom` mutation → navigates to `/game/room/{roomId}`.
  2. **"Join Room"** form: text input for a room code + "Join Room" button → calls `joinRoom` mutation → navigates to `/game/room/{roomId}`.

**Failure paths**:
- Room not found → error: "Room not found."
- Room not accepting players (game in progress) → "Room is not accepting new players."
- Room full → "Room is full."
- Create room fails (unique code generation) → "Failed to generate unique room code."

### 3.5 Room Lobby Page

**Trigger**: User navigates to `/game/room/{roomId}`.

**Behavior for ALL players**:
- Display the 6-character room code prominently, with a "Copy Invite Link" button.
- Display a player grid showing all current room members with:
  - Avatar
  - Username
  - "Owner" badge on the room owner
  - "(You)" indicator on the current user
- Display current/max player count (e.g., "4/12 players").
- Display room settings (read-only for non-owners):
  - Discussion Duration (slider: 10–600 seconds, default 120s)
  - Max Players (slider: 3–20, default 12)
  - Enabled Roles (checkboxes: Sheikh, Girl, Boy — all default enabled)
- "Leave Room" button available to all players.

**Behavior for OWNER only**:
- All settings sliders/checkboxes are interactive.
- A "Kick" button appears next to each non-owner player.
- A "Start Game" button appears (disabled until ≥ 3 players).

**Special behaviors**:
- If the owner leaves: ownership transfers to the earliest-joined remaining member. If no members remain, the room is marked "finished" and becomes inaccessible.
- If a player is kicked: their `roomMembers` row is deleted. (They would see the room disappear on their next re-query.)
- Joining is idempotent: if a user is already a member, the mutation succeeds silently.
- Room code characters are alphanumeric, excluding confusable characters (I, O, 0, 1).
- Room code input is case-insensitive (auto-uppercased).

**Failure paths**:
- Settings change after game started → "Cannot change settings after game has started."
- Kick after game started → "Cannot kick players after game has started."
- Leave after game started → "Cannot leave room after game has started."
- Non-owner tries to change settings or kick → "Only the room owner can perform this action."
- Start with < 3 players → "At least 3 players are required to start."

### 3.6 Game Start

**Trigger**: Room owner clicks "Start Game".

**Backend sequence**:
1. `startGame` mutation:
   - Creates a `games` record with `phase: "cardDistribution"`, `round: 1`.
   - Sets room status to `"in-game"`.
   - Creates one `players` record per room member (role="citizen" placeholder, isAlive=true, isConnected=true).
   - Schedules immediate execution of `distributeCards`.
2. `distributeCards` internal mutation:
   - Builds role list based on player count and enabled roles.
   - Shuffles roles using a cryptographically secure random source (Fisher-Yates + `crypto.getRandomValues`).
   - Patches each player record with their final role.
   - Logs a `cards_distributed` event.

**Visible effect**: The room lobby view transitions to the game board. All players immediately see the card distribution / role reveal screen.

### 3.7 Role Reveal (Card Distribution Phase)

**Phase**: `cardDistribution`

**Behavior for ALL players**:
- Each player sees a single face-down card.
- Tapping the card flips it to reveal:
  - The role name (localized)
  - An icon representing the role
  - A brief description of the role's ability
- After reveal, a "Ready" button appears.

**Special behavior for Mafia players**:
- After revealing their role, mafia players see a "Your Teammates" section listing other mafia members (by username) regardless of count. This list is only visible to mafia.

**Phase advancement**:
- Any player pressing "Ready" calls `advancePhase` with `ownerOverride: true`. If they are the owner, the game advances to Discussion. Non-owners get a silent error catch (they see "Waiting for others...").

**Timing**: No automatic timer on this phase. It stays until the owner advances.

---

### 3.8 Discussion Phase

**Phase**: `discussion`

**Timer**: Configurable. Default = 120 seconds. Range: 10–600 seconds. Countdown displayed prominently.

**Behavior for alive players**:
- See a grid of all alive players.
- Discussion is implied to happen verbally (outside the app) or via an external channel. There is no in-app chat system.

**Behavior for dead players**:
- See a "You are eliminated — Spectating" banner.
- Can still view the player grid but cannot interact.

**Behavior for owner (if alive)**:
- An "End Discussion Early" button is visible.
- Clicking it shows a confirmation dialog: "End the discussion phase now?"
- On confirm: the backend sets the phase deadline to now and schedules an immediate advance.

**Phase advancement**:
- Automatic: when the timer expires, the state machine advances to Public Voting.
- Manual (owner only): via the "End Discussion Early" flow above.

### 3.9 Public Voting Phase

**Phase**: `publicVoting`

**Timer**: Fixed at 45 seconds.

**Behavior for alive players**:
- See a grid of all alive players (excluding themselves) as vote targets.
- Each target shows a vote count badge (real-time) and a list of who voted for them.
- A "Skip Vote" option is available (dashed border, separate button).
- Tapping a player or "Skip" casts/updates the vote immediately.
- Votes can be changed any number of times before the phase ends.
- The current user's selection is highlighted.

**Behavior for dead players**:
- See the vote grid but cannot interact.
- A "Dead players cannot vote" message is displayed.
- Cards are visually dimmed.

**Vote progress indicator**: "X/Y voted" displayed centrally.

**Behavior for owner**:
- A "Confirm Results" button is visible.
- The owner can click it to finalize voting early (even before timer).
- On confirm: votes are tallied, elimination (if any) is applied immediately, and the phase advances.

**Vote resolution logic** (backend):
1. Build tally from all votes.
2. If no votes at all → no elimination.
3. Find the player with the most votes.
4. If there is a tie for the top → no elimination.
5. If skip-votes ≥ the top player's vote count → no elimination.
6. Otherwise → the top-voted player is eliminated (marked `isAlive: false`).

**Phase advancement**:
- Automatic: timer expiry triggers `autoResolvePublicVoting`, which tallies votes and then advances.
- Manual: owner confirms via `confirmVoting`.

### 3.10 Ability Phase (Night)

**Phase**: `abilityPhase`

**Timer**: Fixed at 30 seconds.

**IMPORTANT**: This phase is **entirely skipped** if there is no alive Sheikh AND no alive Girl. The state machine jumps directly from publicVoting to mafiaVoting.

**Behavior for SHEIKH (alive)**:
- Title: "Sheikh Ability"
- Sees a grid of all alive players (excluding self).
- Select one player and click "Investigate".
- Immediately receives a result: "Mafia" or "Citizen" (the target's faction).
- Below the action area, a persistent "Investigation History" section shows all past investigations:
  - Round number, target username, and faction result.
- Can only investigate once per round. After submission, "You already used your ability this round" is shown.

**Behavior for GIRL (alive)**:
- Title: "Girl Ability"
- Sees a grid of all alive players.
- Select one player and click "Protect".
- Protection is recorded. If the protected player is targeted by Mafia this round, the kill is blocked.
- After submission, "Protection submitted" is shown.
- Can only protect once per round.

**Behavior for all OTHER players (Citizens, Mafia, Boy, dead players)**:
- See a "Night phase — abilities in progress" waiting screen.
- A moon emoji and pulsing animation indicate nighttime.
- No interactions available.

**Phase advancement**:
- If both Sheikh and Girl have submitted their actions → deadline is set to now, phase advances immediately.
- If timer expires → phase advances regardless of whether abilities were used.

### 3.11 Mafia Voting Phase

**Phase**: `mafiaVoting`

**Timer**: Fixed at 45 seconds.

**Behavior for alive MAFIA players**:
- See a grid of all alive non-mafia players as targets.
- Tap to vote for a target. Votes are visible to all mafia (real-time tally + voter names).
- Can change vote before phase ends.
- Current vote status: "Your vote: {name}" or "You haven't voted yet".
- A "Confirm" button is available. Any alive mafia member can press it to finalize the voting early.
- A secrecy warning: "Keep this decision private until morning."

**Behavior for NON-MAFIA players (alive or dead)**:
- See a "The mafia is deciding..." waiting screen.
- Moon emoji and a pulsing animation.
- No interactions available.

**Vote resolution logic** (backend):
1. Tally all mafia votes.
2. If no votes → no elimination.
3. If tie for top → no elimination.
4. If the majority target was **protected by Girl** → elimination is **blocked** (protection override).
5. Otherwise → target is marked for elimination (recorded via `mafia_vote_result` event; actual elimination applied in Resolution).

**Phase advancement**:
- Automatic: timer expiry triggers `autoResolveMafiaVoting`.
- Manual: any alive mafia member confirms via `confirmMafiaVoting`.

### 3.12 Resolution Phase

**Phase**: `resolution`

**No user-configurable timer** (except for Boy revenge window: 30 seconds).

**Behavior**:
- Displays a "Round Resolution" screen.
- Shows elimination results from the round:
  - Who was eliminated and by what cause ("Public vote" or "Mafia vote").
  - If no one was eliminated: "No one was eliminated this round."
- A player grid shows all players with current alive/dead state.
- A transition hint at the bottom: "Preparing next phase..."

**Boy Revenge Sub-Phase** (conditional):
- If the eliminated player(s) include a player with the "Boy" role:
  - That player immediately enters a **revenge selection screen**.
  - They see all alive players (excluding themselves) in a grid.
  - They have 30 seconds to select one player and click "Use Revenge".
  - The targeted player is immediately eliminated.
  - If they do not act within 30 seconds, revenge is forfeited.
- Other players see: "Waiting for Boy revenge decision..." banner.
- Boy revenge eliminations are displayed separately: "{name} was also eliminated by Boy's revenge."

**Phase advancement**:
- After elimination application (and after Boy revenge resolves or times out), the system auto-advances.
- A win condition check occurs after the eliminations. If a winner is detected, the game ends immediately without continuing.
- If no winner: the round counter increments and the game transitions to the Discussion phase of the next round.

### 3.13 Win Condition Check

**Phase**: `endCheck` (transient — may not be visible to users)

**Win conditions** (evaluated after every elimination):

| Condition | Winner |
|---|---|
| All mafia are dead (`aliveMafia === 0`) | Citizens |
| Mafia count ≥ Citizen count (`aliveMafia >= aliveCitizens`) | Mafia |

**Evaluation points**:
- After resolution phase applies eliminations.
- After Boy revenge elimination.
- During phase transitions (when advancing from resolution).
- Before entering mafiaVoting (if all mafia already dead → citizens win immediately).

### 3.14 Game Over (Finished Phase)

**Phase**: `finished`

**Behavior for ALL players**:
1. **Winner Announcement**:
   - Displays a faction emoji (🔪 for Mafia, 🛡️ for Citizens).
   - "Game Over" heading.
   - "Winner: {Mafia/Citizens}" text.

2. **Personal Result**:
   - "You were {Role} — your team {won/lost}."

3. **Full Role Reveal Table**:
   - A table showing ALL players with:
     - Username
     - Their role (now revealed to everyone)
     - Status (Alive/Dead)
   - Roles are revealed server-side: the `getGameState` query returns all roles when `phase === "finished"`.

4. **Action Buttons**:
   - **"Play Again"** (enabled only for room owner): calls `playAgain` mutation which resets the room status to `"waiting"` and clears `currentGameId`. The room returns to the lobby state and all current members can start a new game.
   - **"Leave"** button: navigates back to the home page.
   - If the user is NOT the owner: "Waiting for room owner to start a new game" text is shown.

---

## 4. Gameplay Logic & State Flow

### 4.1 Complete State Machine

```
                    ┌──────────────────┐
                    │      lobby       │   (Room is in "waiting" state)
                    └───────┬──────────┘
                            │ startGame (owner, ≥ 3 players)
                            ▼
                    ┌──────────────────┐
                    │ cardDistribution │   No timer. Cards dealt immediately.
                    └───────┬──────────┘
                            │ advancePhase (owner, manual)
                            ▼
              ┌─────────────────────────────┐
  ┌──────────►│         discussion          │◄─── Timer: configurable (10–600s)
  │           └───────────┬─────────────────┘
  │                       │ timer expiry OR owner skip
  │                       ▼
  │           ┌─────────────────────────────┐
  │           │       publicVoting          │◄─── Timer: 45s
  │           └───────────┬─────────────────┘
  │                       │ timer expiry OR owner confirm
  │                       ▼
  │           ┌─────────────────────────────┐
  │           │       abilityPhase          │◄─── Timer: 30s (SKIPPED if no Sheikh & no Girl alive)
  │           └───────────┬─────────────────┘
  │                       │ all abilities submitted OR timer expiry
  │                       ▼
  │           ┌─────────────────────────────┐
  │           │       mafiaVoting           │◄─── Timer: 45s
  │           └───────────┬─────────────────┘
  │                       │ timer expiry OR mafia confirm
  │                       ▼
  │           ┌─────────────────────────────┐
  │           │        resolution           │◄─── Auto (+ Boy revenge: 30s if applicable)
  │           └───────────┬─────────────────┘
  │                       │
  │          ┌────────────┴───────────┐
  │          │ Win condition check    │
  │          ├────────┬───────────────┤
  │          │ Winner │   No winner   │
  │          ▼        │               ▼
  │     ┌──────────┐  │     round++ ──► back to discussion
  │     │ finished  │  │
  │     └──────────┘  │
  │                   │
  └───────────────────┘
```

### 4.2 Player Actions Per Phase

| Phase | Alive Player Actions | Dead Player Actions | Owner-Only Actions |
|---|---|---|---|
| cardDistribution | Reveal own role, press "Ready" | — | Advance phase (via "Ready" button) |
| discussion | View alive players | View (spectate) | "End Discussion Early" |
| publicVoting | Vote for a player or skip; change vote | View only (cannot vote) | "Confirm Results" |
| abilityPhase | Sheikh: investigate. Girl: protect. Others: wait. | Wait | — |
| mafiaVoting | Mafia: vote for non-mafia target. Others: wait. | Wait | — |
| resolution | Boy (if eliminated this round): choose revenge target | View results | — |
| finished | View results, "Play Again" or "Leave" | View results, "Leave" | "Play Again" |

### 4.3 Timing Rules

| Phase | Duration | Source |
|---|---|---|
| cardDistribution | Unlimited (manual advance) | — |
| discussion | 10–600 seconds (default 120s) | Room setting: `discussionDuration` |
| publicVoting | 45 seconds | Hardcoded: `PUBLIC_VOTING_MS` |
| abilityPhase | 30 seconds | Hardcoded: `ABILITY_PHASE_MS` |
| mafiaVoting | 45 seconds | Hardcoded: `MAFIA_VOTING_MS` |
| resolution | Instant + 30s for Boy revenge | Hardcoded: `BOY_REVENGE_MS` |
| endCheck | Instant (transient) | — |

All timers are enforced server-side via scheduled functions. Each timer has a `phaseToken` guard to prevent stale timer fires from affecting a phase that has already been manually advanced.

### 4.4 Role Distribution Rules

| Player Count | Mafia Count | Special Roles |
|---|---|---|
| 3–5 | 1 | Up to 3 specials if enabled |
| 6–8 | 2 | Up to 3 specials if enabled |
| 9–12 | 3 | Up to 3 specials if enabled |
| 13–20 | 4 | Up to 3 specials if enabled |

Special roles (if enabled in room settings): one Sheikh, one Girl, one Boy. Remaining citizen slots filled with plain "Citizen" role.

### 4.5 Role Descriptions

| Role | Faction | Ability |
|---|---|---|
| **Citizen** | Citizens | No special ability. Discuss and vote. |
| **Sheriff/Sheikh** | Citizens | Each night: investigate one player → learn their faction (Mafia or Citizen). Accumulates investigation history. |
| **Girl** | Citizens | Each night: protect one player → if that player is targeted by Mafia, the kill is blocked. |
| **Boy** | Citizens | On elimination: gets a 30-second revenge window to eliminate one other player. |
| **Mafia** | Mafia | Each night: mafia team collectively votes to eliminate one non-mafia player. See each other's identities from the start. |

### 4.6 Visibility Rules (Information Asymmetry)

| Data | Visible To |
|---|---|
| Own role | Always (after card distribution) |
| Other players' roles | Never during active game; ALL roles revealed when `phase === "finished"` |
| Mafia teammates list | Mafia players only (from card distribution onward) |
| Public vote tally | All players (real-time) |
| Public vote identities (who voted for whom) | All players (real-time) |
| Mafia vote tally | Alive mafia players only |
| Mafia vote identities | Alive mafia players only |
| Sheikh investigation results | Only the Sheikh who performed them |
| Girl protection target | Server-only; never exposed to any client |
| Boy revenge target | All players see the result (elimination) |
| Player alive/dead status | All players |

---

## 5. Data Models That Affect UX

### 5.1 User

| Field | Type | UX Impact |
|---|---|---|
| `username` | string (3–24 chars) | Displayed everywhere as player identity. Unique. |
| `image` / `avatarStorageId` | URL / storage ID | Avatar shown in player grids, headers. Falls back to initial letter. |
| `hasCompletedProfile` | derived (Boolean(username)) | Gates access to game features. |
| `stats.gamesPlayed` | number | Not currently displayed in any UI. Available for future. |
| `stats.wins` | number | Not currently displayed. |
| `stats.losses` | number | Not currently displayed. |

**When values change**:
- `username` and `avatarStorageId`: set once during onboarding. No edit flow exists.
- `stats`: incremented at game end. Each player's win/loss is determined by their faction vs. the `winnerFaction`.

### 5.2 Room

| Field | Type | UX Impact |
|---|---|---|
| `code` | 6-char string | Displayed in lobby; used for joining. |
| `ownerId` | user ID | Determines who sees settings controls, kick, start buttons. |
| `status` | "waiting" / "in-game" / "finished" | Controls which view renders (lobby vs game board). |
| `settings.discussionDuration` | number (seconds) | Feeds the discussion timer. |
| `settings.maxPlayers` | number (3–20) | Limits joins and displayed in player count. |
| `settings.enabledRoles` | {sheikh, girl, boy} booleans | Determines which special roles appear in the game. |
| `currentGameId` | optional game ID | If present + status "in-game", renders the game board. |

**When values change**:
- `status`: changes from "waiting" → "in-game" on game start; "in-game" → "waiting" when owner triggers "Play Again".
- `settings`: only modifiable while `status === "waiting"`.
- `ownerId`: can change if current owner leaves (transfers to earliest joiner).

### 5.3 Game

| Field | Type | UX Impact |
|---|---|---|
| `phase` | One of 9 phases | Determines which screen/component is rendered. |
| `round` | number (starts at 1) | Displayed in the phase header. |
| `phaseDeadlineAt` | timestamp (ms) | Fed to the countdown timer component. |
| `winnerFaction` | "mafia" / "citizens" / undefined | Drives the game over screen content. |
| `startedAt` / `endedAt` | timestamps | Not currently displayed. |

### 5.4 Player (per-game)

| Field | Type | UX Impact |
|---|---|---|
| `role` | "mafia" / "citizen" / "sheikh" / "girl" / "boy" | Determines ability UI shown during abilityPhase. Shown in role badge. |
| `isAlive` | boolean | Dead players get dimmed display + "Spectating" banner. Cannot vote/act. |
| `isConnected` | boolean | Currently set to `true` on creation. No disconnect detection implemented yet. |
| `eliminatedAtRound` | number / undefined | Used to determine if Boy can use revenge this round. |

### 5.5 Vote

| Field | Purpose |
|---|---|
| `phase: "public"` | Public voting round vote. Visible to all. |
| `phase: "mafia"` | Mafia-only night vote. Visible only to alive mafia. |
| `isSkip` | True if the voter chose to skip (public voting only). |
| `targetId` | Who was voted for. Updated in place if changed. |

### 5.6 Action

| Field | Purpose |
|---|---|
| `role: "sheikh"` | Investigation. `result` contains "mafia" or "citizens". |
| `role: "girl"` | Protection. No visible result. |
| `role: "boy"` | Revenge. `targetId` is who was eliminated. |

---

## 6. Progression, Rewards & Economy

### 6.1 Player Stats

Stats are tracked but **not currently surfaced in any UI screen**:

- `gamesPlayed`: incremented by 1 per game, for every player, regardless of outcome.
- `wins`: incremented by 1 if the player's faction matches the `winnerFaction`.
- `losses`: incremented by 1 if the player's faction does NOT match the `winnerFaction`.

### 6.2 No XP / Leveling / Unlock System

- No XP, levels, experience points, or progression tiers exist.
- No unlockable content, cosmetics, or rewards.
- No in-game currency or economy.

**ASSUMPTION**: Stats are placeholder infrastructure for a future leaderboard or profile screen.

---

## 7. Errors, Edge Cases & Non-Happy Paths

### 7.1 Invalid Actions

| Action | Condition | Error Message |
|---|---|---|
| Vote when dead | Player `isAlive === false` | "Dead players cannot vote." |
| Vote for self (public) | voterId === targetId | "Cannot vote for yourself." |
| Vote for dead player | target `isAlive === false` | "Cannot vote for a dead player." |
| Mafia votes for mafia | target.role === "mafia" | "Mafia cannot target mafia." |
| Sheikh investigates self | actorId === targetId | "Sheikh cannot investigate themselves." |
| Use ability twice per round | Existing action found | "You have already used your ability this round." |
| Boy revenge when not eliminated | `me.isAlive === true` | "Boy revenge is only available when eliminated this round." |
| Non-boy uses revenge | `me.role !== "boy"` | "Only Boy can use revenge." |
| Non-owner tries to start game | `room.ownerId !== userId` | "Only the room owner can perform this action." |
| Non-owner tries to skip discussion | `room.ownerId !== userId` | "Only the room owner can skip the discussion." |
| Non-owner tries to confirm voting | `room.ownerId !== userId` | "Only the room owner can confirm voting." |
| Access game you're not in | Player not found | "You are not a player in this game." / "Requester is not a player in this game." |

### 7.2 Timeouts & Auto-Resolution

| Phase | On Timeout |
|---|---|
| discussion | Auto-advances to publicVoting. |
| publicVoting | Tallies whatever votes exist → applies elimination (or none) → advances. |
| abilityPhase | Advances to mafiaVoting regardless of ability usage. Unused abilities are forfeited. |
| mafiaVoting | Tallies whatever mafia votes exist → records result → advances. |
| resolution (Boy revenge) | Forfeits any unused Boy revenge → advances to next round or finished. |

### 7.3 Conflicts & Race Conditions

- **Phase token system**: Every phase transition increments a `phaseToken`. Scheduled timers carry an `expectedToken` and only fire if the game's current token matches. This prevents stale timers from re-advancing a phase that was already advanced manually.
- **Double-vote**: Votes are upserted (existing vote is updated, not duplicated). Only one vote per voter per round per phase exists.
- **Double-ability**: Checked via existing action query before inserting.
- **Double-resolution**: The `round_resolution_applied` event acts as an idempotency guard. If found, the resolver returns early.
- **Double-mafia-resolution**: The `mafia_vote_result` event acts as an idempotency guard.

### 7.4 Partial Failures

| Scenario | Behavior |
|---|---|
| Avatar upload succeeds but `setAvatarFromStorage` fails | User has a username but broken avatar. Their initials are shown instead. |
| Vote cast succeeds but network drops before UI update | Convex's real-time subscription will auto-sync on reconnection. |
| Game started but `distributeCards` fails | Players see the card distribution screen indefinitely. No automatic recovery. Manual admin intervention required. |

### 7.5 Stale Room Cleanup

A cron job runs every 15 minutes:
- Finds rooms in `"waiting"` state where `lastActivityAt` is > 30 minutes ago.
- Deletes all `roomMembers` for those rooms.
- Marks the room as `"finished"`.
- Up to 50 rooms per cron run.

---

## 8. Permissions, Constraints & Limits

### 8.1 Room Constraints

| Constraint | Value |
|---|---|
| Min players to start | 3 |
| Max players per room | 3–20 (configurable) |
| Absolute max players | 20 |
| Room code length | 6 characters |
| Allowed code chars | A-Z (no I/O) + 2-9 (no 0/1) |
| Discussion duration range | 10–600 seconds |
| Stale room timeout | 30 minutes of inactivity |

### 8.2 Username Constraints

| Constraint | Value |
|---|---|
| Min length | 3 |
| Max length | 24 |
| Allowed characters | `[a-zA-Z0-9_]` |
| Uniqueness | Case-insensitive |

### 8.3 Action Limits per Round

| Action | Limit |
|---|---|
| Public vote | 1 per round (can be changed) |
| Mafia vote | 1 per round (can be changed) |
| Sheikh investigation | 1 per round (cannot undo) |
| Girl protection | 1 per round (cannot undo) |
| Boy revenge | 1 per game (only on elimination) |

### 8.4 Phase Advancement Permissions

| From → To | Who Can Advance |
|---|---|
| cardDistribution → discussion | Owner only (manual, via "Ready") |
| discussion → publicVoting | Timer (auto) or Owner (skip) |
| publicVoting → abilityPhase | Timer (auto) or Owner (confirm) |
| abilityPhase → mafiaVoting | Timer (auto) or all abilities submitted (auto) |
| mafiaVoting → resolution | Timer (auto) or any mafia member (confirm) |
| resolution → discussion (next round) | System auto-advance after resolution completes |
| any → finished | System auto (win condition detected) or Owner (manual end game) |

### 8.5 Hard Locks

- Cannot join a room that is `"in-game"` or `"finished"`.
- Cannot leave a room while a game is in progress.
- Cannot change settings while a game is in progress.
- Cannot kick players while a game is in progress.
- Cannot start a new game until the current one is finished.
- Game over screen — only the owner can trigger "Play Again."

---

## 9. Analytics & Events

The system maintains an append-only `gameEvents` table. These are not exposed to players as a feed, but they represent all significant game milestones:

### 9.1 Event Types

| Event Type | Trigger | Payload |
|---|---|---|
| `phase_transition` | Every phase change | `{ from, to, reason, phaseDeadlineAt, phaseToken }` |
| `game_finished` | Win condition met | `{ winnerFaction, reason }` |
| `cards_distributed` | After role assignment | `{ playerCount, mafiaCount, enabledRoles }` |
| `discussion_skipped` | Owner skips discussion | `{ skippedBy: userId }` |
| `public_elimination` | Public vote eliminates | `{ eliminatedPlayerId, voteCount, totalVotes }` |
| `no_elimination` | Public vote produces no elimination | `{ reason, tally, skipCount }` |
| `mafia_vote_result` | Mafia vote resolves | `{ eliminatedPlayerId, noElimination, protectionBlocked, tally, totalVotes }` |
| `sheikh_investigated` | Sheikh uses ability | `{ actorId }` (result stored on action record, not event) |
| `girl_protected` | Girl uses ability | `{ actorId }` |
| `round_resolution_applied` | Eliminations applied | `{ eliminatedPlayerIds, boyPendingIds }` |
| `elimination_applied` | Per-player elimination | `{ playerId, causes }` |
| `boy_revenge_window_opened` | Boy eligible for revenge | `{ boyPlayerIds, deadlineAt }` |
| `boy_revenge_elimination` | Boy uses revenge | `{ boyPlayerId, targetPlayerId }` |
| `boy_revenge_forfeited` | Boy did not act in time | `{ boyPlayerIds }` |

### 9.2 Event Visibility

Game events are **not** exposed to any client-facing UI. They serve as an audit log and are used internally for resolution logic (e.g., detecting already-applied resolutions, finding pending Boy revenges).

---

## 10. UX-Relevant Assumptions & Gaps

### 10.1 Confirmed Gaps (Code Not Implemented)

| # | Gap | Impact |
|---|---|---|
| 1 | **No in-app chat or messaging** | Discussion phase relies on players communicating outside the app (e.g., voice chat, same room). |
| 2 | **No reconnection handling** | `isConnected` field exists on players but is never updated after creation. No heartbeat, no disconnect detection, no reconnection flow. If a player's browser tab closes, other players see no indication. |
| 3 | **No profile editing** | Username and avatar are set once during onboarding. No mutation exists to update them. |
| 4 | **No stats display screen** | `stats` (gamesPlayed, wins, losses) are tracked but never rendered in any UI. |
| 5 | **No game history / match history** | Past games cannot be browsed or reviewed. |
| 6 | **No sound effects or haptic feedback** | No audio/vibration for phase transitions, eliminations, or timer warnings. |
| 7 | **No push notifications** | Players must keep the app open to see game state changes. |
| 8 | **No spectator mode** | Only players in the game can view it. External observers cannot watch. |
| 9 | **No password/account recovery** | No "forgot password" flow exists. |
| 10 | **No email/password validation UI** | No inline validation for email format, password strength, etc. |
| 11 | **Post-game chat period** | T13 mentioned this as "optional P2" — not implemented. |
| 12 | **Role reveal animation** | T13 specifies "flip all hidden cards simultaneously" on game end — the full reveal table is static, not animated. |
| 13 | **Light theme** | Only dark theme is implemented. CSS references it but no toggle exists. |

### 10.2 Assumptions (Inferred Behavior)

| # | Assumption | Basis |
|---|---|---|
| 1 | **Discussion is verbal/external** | No chat component exists; no messages table in schema. The discussion phase is a social phase happening via voice or in person. |
| 2 | **Phase transition overlay is brief** | The `PhaseTransitionController` shows a 2-second full-screen overlay with the new phase name when transitions occur. It fades out automatically. |
| 3 | **Dead players remain in the room** | No mechanism exists to remove dead players from the room. They continue as spectators until game end. |
| 4 | **Room owner role is permanent during a game** | The ownership transfer logic only applies when a player leaves the room in "waiting" state. During an active game, there is no leave mechanism and ownership cannot change. |
| 5 | **One game per room at a time** | The schema supports exactly one `currentGameId` per room. "Play Again" clears it and returns to lobby. |
| 6 | **Mafia see each other from the start** | The `getMafiaTeammates` query and the `mafiaTeammates` field in `getGameState` ensure mafia know each other from card distribution onward. |
| 7 | **Skip-count acts as a "no elimination" preference** | In public voting, if skipVotes ≥ topCandidate votes, no one is eliminated. |
| 8 | **Boy revenge target can be anyone alive (including mafia)** | The mutation only checks `target.isAlive` and `target !== self`. No faction restriction. |

### 10.3 Areas of Ambiguity

| # | Area | Detail |
|---|---|---|
| 1 | **What happens when browser is closed mid-game?** | The player remains listed in the game. Their `isConnected` stays `true`. Other players see no change. The game continues normally — their votes/actions are simply missing. |
| 2 | **Can a room be reused after "Play Again"?** | Yes. The same room code persists. All current `roomMembers` remain. New players could theoretically join before the next game starts. |
| 3 | **What if all players leave before game ends?** | The game has no abandon detection. It would remain in its current phase indefinitely until the stale-room cron cleans up the room (but only if still "waiting" — "in-game" rooms are NOT cleaned). |
| 4 | **Phase header during transitions** | The `PhaseHeader` component always shows the current phase name plus a round counter and the player's own role badge. The role badge uses faction-themed colors. |
| 5 | **Graveyard visibility** | The player graveyard sidebar shows eliminated players during ALL active game phases (not during `finished`). It appears below the phase-specific content. |

---

*End of specification. This document reflects the complete implemented behavior as of 2026-02-13.*
