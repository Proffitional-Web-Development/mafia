# Phase 04 — Interaction States, Animations & Responsiveness

> **Goal:** Layer in all interactive behaviors, animation polish, real-time state synchronization, and responsive layout adjustments that go beyond static composition. After this phase, the app feels alive and responsive.

> **Depends on:** Phase 01 (animations defined in CSS), Phase 02 (components built), Phase 03 (screens assembled).

---

## Scope Overview

Phase 3 delivers visually correct screens with basic interactivity (click handlers, form submissions). Phase 4 adds:

1. **Micro-interactions** — press feedback, hover effects, focus states
2. **Animations** — card flip, shimmer, float, pulse, fade-in sequences
3. **Real-time visual sync** — live vote counts, player join/leave, timer urgency transitions
4. **Loading & error states** — skeletons, error banners, optimistic updates
5. **Empty & edge-case states** — no players, no votes, expired timer
6. **Mobile responsiveness** — safe areas, touch targets, viewport-aware layouts

---

## 4.1 — Global Micro-Interactions

**Files affected:** All interactive components (PrimaryButton, SecondaryButton, PlayerCard, AvatarCircle, TextInput, VoteButton equivalents)

| Interaction | Implementation | Components |
|---|---|---|
| Press feedback | `active:scale-[0.98]` on all tappable elements | PrimaryButton, SecondaryButton, PlayerCard, BottomNavigation tabs |
| Hover border shift | `hover:border-white/10` → `hover:border-primary/50` | PlayerCard, TextInput, cards |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background` | All focusable elements |
| Button icon nudge | `group-hover:translate-x-1` on trailing arrow icons | PrimaryButton (with `arrow_forward` icon) |
| Disabled dimming | `disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed` | All buttons, cards |
| Tooltip on copy | Brief "Copied!" feedback via state toggle | RoomCodeCard copy button |

**Acceptance criteria:**
- [ ] Every tappable element has visible press feedback
- [ ] Every focusable element has a visible focus ring (keyboard navigation)
- [ ] Disabled elements cannot be interacted with and appear dimmed

---

## 4.2 — Component-Level Animations

### 4.2.1 — Card Flip (RoleRevealCard)

**File:** `components/game/role-reveal-card.tsx`

- Implement `perspective-1000` on wrapper
- Two faces with `backface-visibility: hidden` and `preserve-3d`
- Flip trigger: controlled state `isRevealed` → `rotateY(180deg)` with `duration-700`
- Post-flip: fade in "Tap card to reveal" instruction hiding → `PrimaryButton` fade-in with `delay-300`
- Card back: decorative SVG pattern (concentric circles or diamond grid), centered "?" emblem

**Acceptance criteria:**
- [ ] Card flips smoothly on tap (no flicker, no z-fighting)
- [ ] Back face fully hidden after flip
- [ ] Works on Safari (may need `-webkit-backface-visibility`)

### 4.2.2 — Shimmer Effect (PrimaryButton)

**File:** `components/ui/primary-button.tsx`

- CSS `@keyframes shimmer { from { translateX(-100%) } to { translateX(100%) } }` on a pseudo-element
- Runs on CTA buttons: "Confirm Kill", "USE REVENGE", "I AM READY"
- Prop: `shimmer?: boolean`

**Acceptance criteria:**
- [ ] Light streak passes across button surface on loop
- [ ] Does not affect button text readability

### 4.2.3 — Floating Badge (Girl Protection)

**File:** `components/game/girl-protection-view.tsx` or `ability-phase.tsx`

- Role badge uses `animate-float` (3s ease-in-out translateY ±6px)
- Badge: `bg-neutral-surface/80 backdrop-blur-md rounded-full border border-primary/30`

### 4.2.4 — Timer Pulse Ring (Discussion)

**File:** `components/ui/timer-display.tsx` (circle variant)

- `@keyframes timer-pulse-ring { 0%,100% { box-shadow: 0 0 0 0 primaryColor/40 } 50% { box-shadow: 0 0 0 12px transparent } }`
- Applied to circular timer container
- Intensifies (faster cycle) as time decreases

### 4.2.5 — Vote Badge Bounce

**File:** `components/ui/badge.tsx` (vote-count variant)

- When vote count increments: apply `animate-bounce` for 1 cycle
- Use `key={voteCount}` trick or `useEffect` to trigger on change

### 4.2.6 — Avatar Grayscale → Color

**Files:** `PlayerCard` (mafia-target, protection variants)

- Default: `filter: grayscale(100%)`
- On hover: `group-hover:grayscale-0` with `transition-[filter] duration-300`
- On selection: `grayscale-0` permanently

### 4.2.7 — Ambient Blob Pulse

**Files:** Background layers on all screens

- Blur blobs (`absolute w-96 h-96 rounded-full bg-primary/15 blur-[100px]`) use `animate-pulse-slow` (3–4s cycle)
- Two blobs per screen, offset positions

### 4.2.8 — Phase Transition Flash

**File:** `components/game/phase-transition-controller.tsx`

- Currently: full-screen overlay with blur, 2s timeout
- Enhance: add `animate-in fade-in zoom-in-95` on mount, `fade-out` on unmount
- Add design phase icon (Material Icon instead of current text-only)

---

## 4.3 — Real-Time Visual State Sync

**Files affected:** All game phase components

### 4.3.1 — Live Vote Tally Updates

**Screens:** Public Voting, Mafia Voting

- Vote count badges update reactively via Convex subscription (already queried — ensure badge re-renders with animation)
- Voter avatar stack grows/shrinks in real-time
- "All voted" state triggers visual hint (e.g., CTA button enables with glow)

### 4.3.2 — Player Join/Leave in Lobby

**Screen:** Room Lobby

- Player cards appear/disappear with `animate-in fade-in slide-in-from-bottom-2`
- Empty slot count adjusts (`4/12 Joined` badge updates)
- Player disconnect: avatar gets `opacity-50` treatment (if implementing presence)

### 4.3.3 — Timer Urgency Transitions

**All timed phases:** Discussion, Public Voting, Ability, Mafia Voting, Boy Revenge

- `> 30s`: Normal styling (white/primary text)
- `≤ 30s`: Amber text color transition
- `≤ 10s`: Red text + `animate-pulse` + progress bar turns red
- `0s`: Auto-advance triggers (already handled by Convex crons — ensure UI reflects)

### 4.3.4 — Speaking Indicator (Discussion)

**Screen:** Discussion Phase

- Pulsing green dot on `PlayerCard (speaking)` variant
- If voice-based: integrate with WebRTC state. If turn-based: show based on game state
- **Decision needed:** Is this purely visual decoration or tied to real state?

---

## 4.4 — Loading & Error States

### 4.4.1 — Page-Level Loading

**Files affected:** All page components

- While Convex queries resolve: show skeleton layout (gray pulsing rectangles matching component shapes)
- No spinner unless a specific action is pending
- Use `useQuery` return value: `undefined` = loading, `null` = not found

### 4.4.2 — Action Loading States

**Files affected:** All mutation-triggering buttons

- When a mutation is pending: button shows loading state (`loading` prop → spinner icon + disabled)
- `PrimaryButton` loading: replace icon with spinning `refresh` icon, disable press

### 4.4.3 — Error Handling

**Files affected:** All mutation call sites

- Wrap mutation calls in try/catch
- Show `StatusBanner (variant="warning")` or toast for transient errors
- Show `ConfirmDialog` for destructive action failures
- Existing `errors` namespace in i18n has keys: `sessionExpired`, `network`, `unknown`, `roomNotFound`, `roomFull`, `gameAlreadyStarted`

### 4.4.4 — Empty States

| Context | Empty State |
|---|---|
| Graveyard (no dead players) | Hidden (`GraveyardSheet` already handles) |
| Investigation log (night 1) | "No previous investigations" message |
| Room lobby (only host) | Show 1 player + 7 empty dashed slots |
| Public voting (no votes yet) | "No Votes" label on each card, CTA disabled |
| Game report (mid-game, shouldn't happen) | N/A — only shown at game end |

---

## 4.5 — Mobile Responsiveness Adjustments

### 4.5.1 — Safe Areas

**Files affected:** `app/globals.css`, all fixed-position components

- Apply `padding-top: env(safe-area-inset-top)` on page header
- Apply `padding-bottom: env(safe-area-inset-bottom)` on `BottomNavigation` and `BottomActionBar`
- Use `h-[100dvh]` instead of `h-screen` for full-height containers (already in design)

### 4.5.2 — Touch Targets

- Minimum touch target: 44×44px (WCAG 2.5.5)
- Player cards in 3-col grids may be tight — ensure minimum height
- Bottom nav icons: ensure `min-h-[44px] min-w-[44px]`

### 4.5.3 — Viewport Breakpoints

| Breakpoint | Layout Adjustment |
|---|---|
| < 360px (narrow) | Reduce page padding to `px-4`, card padding to `p-2` |
| 360–414px (standard mobile) | Default design (`px-6`, `max-w-sm`) |
| 414–768px (large phone/small tablet) | `max-w-md`, potentially 3-col grids |
| > 768px (tablet/desktop) | Center container with max-width, add side margins |

### 4.5.4 — Keyboard Handling

**Files affected:** TextInput, auth form, room code input

- When virtual keyboard opens: scroll focused input into view
- Ensure `BottomActionBar` doesn't overlap keyboard (use `visualViewport` API or `position: sticky` instead of `fixed`)

### 4.5.5 — Orientation Lock

- Design is portrait-only. Consider adding `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">` to prevent zoom on input focus.
- Flag: viewport locking has accessibility implications. Make this a product decision.

---

## 4.6 — Scroll Behavior

**Files affected:** All scrollable screens

- Main content area: `overflow-y-auto no-scrollbar` (hide scrollbar but keep scrollability)
- Bottom gradient fade: `bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent h-20` fixed above `BottomActionBar` to visually fade content
- Smooth scroll: `scroll-behavior: smooth` on scrollable containers
- Bottom sheet (`GraveyardSheet`): if implementing drag, use `touch-action: none` on handle

---

## Parallelizable Tasks

| Task Group | Can parallelize with |
|---|---|
| 4.1 Micro-interactions | 4.4 Loading states |
| 4.2 Animations (all sub-tasks) | Each animation is independent — all 8 can run in parallel |
| 4.3 Real-time sync | Must follow Phase 3 screen assembly |
| 4.5 Responsiveness | Independent of 4.1–4.4 |
| 4.6 Scroll behavior | Independent |

---

## Acceptance Criteria (Phase-Level)

- [ ] All animations run at 60fps (no jank on mid-range mobile devices)
- [ ] Every interactive element has press, hover, focus, and disabled states
- [ ] Timer urgency transitions are smooth and correctly timed
- [ ] Loading states appear while Convex queries resolve
- [ ] Error states display user-friendly messages from i18n
- [ ] App works correctly on 360px–414px viewport widths
- [ ] Safe area insets respected on notched devices
- [ ] No horizontal scroll at any viewport width
- [ ] Touch targets ≥ 44px for all interactive elements

---

## Risks & Ambiguities

| Risk | Mitigation |
|---|---|
| Too many simultaneous CSS animations may cause jank on low-end devices | Use `will-change` sparingly, prefer `transform`/`opacity` animations only. Profile with Chrome DevTools. |
| Ambient background blobs with `blur-[100px]` are GPU-heavy | Consider reducing blur radius or using static gradient images on low-power devices |
| `GraveyardSheet` drag behavior requires touch gesture handling | Start with a simple expand/collapse toggle. Drag can be a follow-up enhancement. |
| Speaking indicator depends on undefined feature (voice chat?) | Implement as visual decoration for now — controlled by game state rather than actual audio |
| Viewport locking (`maximum-scale=1`) may cause accessibility issues | Default to allowing zoom. Lock only if product requirements demand it. |
| Keyboard-shifting layout on mobile is complex | Test on iOS Safari and Android Chrome. Use `visualViewport` API for accurate height. |
