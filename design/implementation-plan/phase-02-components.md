# Phase 02 — Shared & Reusable Component Implementation

> **Goal:** Build (or rebuild) every reusable UI component documented in `/design-analysis/components/` so that Phase 3 screen assembly uses only pre-built parts. Each component listed here maps 1:1 to a design-analysis component spec.

> **Depends on:** Phase 01 (design system tokens, CSS variables, Icon component, theme context).

---

## Current State — Reuse vs. Rebuild Matrix

Legend: **Keep** = usable as-is · **Extend** = add variants/props · **Rebuild** = rewrite to match design · **New** = does not exist

| Design Component | Existing File | Verdict | Rationale |
|---|---|---|---|
| `PrimaryButton` | `components/ui/button.tsx` | **Rebuild** | Current button is a generic CVA wrapper. Design requires full-width, glow, shimmer, icon slot, `active:scale-[0.98]`, danger variant — fundamentally different props & variants. |
| `SecondaryButton` | `components/ui/button.tsx` | **Rebuild** | Needs outline, ghost, oauth, dashed, text-link variants. Current button only has `default` and `outline`. |
| `TextInput` | — | **New** | No input component exists. Design needs themed input with icon prefix, validation states, character counter. |
| `PlayerCard` | `components/ui/player-grid.tsx` (inline) | **Rebuild** | Currently a monolithic grid+card component. Design specifies 10 distinct card variants (game-phase, selected, self, speaking, voting, mafia-target, ability, protection, dead, lobby). Must extract card as standalone component. |
| `PlayerGrid` | `components/ui/player-grid.tsx` | **Extend** | Layout logic is sound. Needs: configurable column count (2/3/4), gap options, but should delegate rendering to new `PlayerCard`. |
| `AvatarCircle` | `components/user-avatar.tsx` | **Extend** | Core logic (image/initial fallback) is reusable. Needs 8 variants: default, online dot, glow ring, selected border, dead (grayscale), initials, edit badge, glow-wrapper. |
| `TimerDisplay` | `components/ui/phase-timer.tsx` | **Rebuild** | Current timer is text-only. Design needs 5 variants: circular (discussion), SVG ring (sheikh/boy), inline (voting/mafia), progress bar, compact. Timer math logic reusable. |
| `BottomNavigation` | — | **New** | 3-tab fixed bottom nav bar. Not in current codebase. |
| `BottomActionBar` | — | **New** | Fixed bottom CTA container with gradient fade. 5 layout variants. |
| `PhaseHeader` | `components/game/phase-header.tsx` | **Rebuild** | Current header is a simple bar. Design needs 6 variants per game phase (standard, discussion, voting, ability-left, ability-split, mafia-night). |
| `StepIndicator` | — | **New** | 3-step progress bar for onboarding. |
| `RoomCodeCard` | (inline in room page) | **New** | Standalone card with copy-to-clipboard. Currently baked into room page. |
| `LanguageSwitcher` | `components/language-switcher.tsx` | **Rebuild** | Currently a `<select>` dropdown. Design requires pill toggle (EN/AR) + globe icon variant. |
| `RoleRevealCard` | `components/ui/role-card.tsx` | **Rebuild** | Current card is a flat button with reveal. Design requires 3D CSS flip (`preserve-3d`, `backface-visibility`), SVG card-back pattern, decorative emblem. |
| `GraveyardSheet` | `components/game/player-graveyard.tsx` | **Rebuild** | Current graveyard is a static grid. Design requires bottom-sheet with drag handle, `rounded-t-2xl`. |
| `EliminationCard` | — | **New** | Announcement card for morning resolution (avatar, name, cause of death). |
| `InvestigationLog` | (inline in ability-phase.tsx) | **New** | Glass-panel component for Sheikh's past investigation results. Currently rendered inline. Extract and style. |
| `GameReportRow` | (inline in finished-phase.tsx) | **New** | Table row component for game-over results. 4 variants (alive, dead-mafia, self, dead-citizen). Currently inline. |
| `UserStatusCard` | — | **New** | Floating profile card for home screen. |
| `Divider` | — | **New** | Text/gradient separators. 4 variants (text, gradient, icon, plain). |
| `Badge` | (various inline usages) | **New** | 8 variants: vote count, YOU, host, phase, status, player count, investigation result, notification. Currently scattered inline spans. |
| `WaitingOverlay` | (inline in ability-phase/mafia-voting) | **New** | Full-screen waiting state (moon icon + text). Currently inline. Extract. |
| `SuggestedChips` | — | **New** | Tappable suggestion pills for username selection. |
| `SettingsPanel` | (inline in room page) | **New** | Game config sliders. Currently inline in LobbyView. Extract and style. |
| `RevengePanel` | (inline in resolution-phase.tsx) | **New** | Compact revenge selection panel. Currently inline. Extract and style. |
| `ConfirmDialog` | `components/ui/confirm-dialog.tsx` | **Extend** | Works, but needs design-aligned styling (dark surfaces, primary/danger variants). |
| `StatusBanner` | `components/ui/status-banner.tsx` | **Extend** | Works, needs design-aligned colors and border-radius. |
| `VoteButton` | `components/ui/vote-button.tsx` | **Extend** | Needs design-aligned styling. May be subsumed by `PlayerCard (voting)` variant. |
| `PlayerAvatar` | `components/ui/player-avatar.tsx` | **Remove** | Redundant once `AvatarCircle` + `PlayerCard` handle all game-aware avatar states. Keep until Phase 3 migration done. |

---

## Implementation Order

Components have internal dependencies. Build in this order:

### Tier 1 — Primitives (no internal deps, build first)

These can all be built **in parallel**:

| # | Component | File | Key Details |
|---|---|---|---|
| 2.1 | `Icon` | `components/ui/icon.tsx` | From Phase 1.2. If not done in Phase 1, do here. |
| 2.2 | `Badge` | `components/ui/badge.tsx` | 8 variants (CVA). Used by almost every other component. |
| 2.3 | `Divider` | `components/ui/divider.tsx` | 4 variants. Simple presentational. |
| 2.4 | `TextInput` | `components/ui/text-input.tsx` | Icon prefix, suffix, validation, counter. |
| 2.5 | `StepIndicator` | `components/ui/step-indicator.tsx` | 3-step progress. Props: `currentStep`, `totalSteps`. |
| 2.6 | `SuggestedChips` | `components/ui/suggested-chips.tsx` | List of tappable pills. Props: `suggestions[]`, `onSelect`. |

### Tier 2 — Core Interactive (depend on Badge/Icon)

Build **in parallel** after Tier 1:

| # | Component | File | Key Details |
|---|---|---|---|
| 2.7 | `PrimaryButton` | `components/ui/primary-button.tsx` | Rewrite. Full-width, glow, shimmer, icon slot, danger variant, loading state. Uses `Icon`. |
| 2.8 | `SecondaryButton` | `components/ui/secondary-button.tsx` | New variants: outline, ghost, oauth, dashed, text-link, danger-text. Uses `Icon`. |
| 2.9 | `AvatarCircle` | `components/ui/avatar-circle.tsx` | Extend `UserAvatar` core. Add: online dot, glow, selected, dead (grayscale), edit badge, glow-wrapper. Uses `Badge`. |
| 2.10 | `TimerDisplay` | `components/ui/timer-display.tsx` | 5 variants. Reuse timer math from existing `PhaseTimer`. SVG ring variant needs `stroke-dasharray`/`stroke-dashoffset`. |
| 2.11 | `LanguageSwitcher` | `components/language-switcher.tsx` | Rebuild as pill toggle (EN/AR) + globe icon variant. Same routing logic. |

### Tier 3 — Composite (depend on Tier 2)

Build **in parallel** after Tier 2:

| # | Component | File | Key Details |
|---|---|---|---|
| 2.12 | `PlayerCard` | `components/ui/player-card.tsx` | 10 variants using CVA. Uses `AvatarCircle`, `Badge`, `Icon`. Extract from `PlayerGrid`. |
| 2.13 | `PlayerGrid` | `components/ui/player-grid.tsx` | Refactor to be a layout wrapper. Renders `PlayerCard` children. Configurable cols (2/3/4). |
| 2.14 | `PhaseHeader` | `components/game/phase-header.tsx` | 6 layout variants. Uses `Badge`, `TimerDisplay`, `Icon`. |
| 2.15 | `BottomNavigation` | `components/ui/bottom-navigation.tsx` | 3 tabs (Home, Profile, Settings). Uses `Icon`. Fixed positioning. |
| 2.16 | `BottomActionBar` | `components/ui/bottom-action-bar.tsx` | Gradient-fade container for fixed bottom CTAs. 5 layout patterns. |
| 2.17 | `RoomCodeCard` | `components/ui/room-code-card.tsx` | Room code + copy button. Uses `Icon`, `Badge`. |
| 2.18 | `WaitingOverlay` | `components/ui/waiting-overlay.tsx` | Full-screen waiting with moon/spinner. Uses `Icon`. |

### Tier 4 — Complex Composites (depend on Tier 3)

Build **in parallel** after Tier 3:

| # | Component | File | Key Details |
|---|---|---|---|
| 2.19 | `RoleRevealCard` | `components/game/role-reveal-card.tsx` | 3D flip card. CSS `preserve-3d`. Decorative SVG back. Uses `Icon`. |
| 2.20 | `GraveyardSheet` | `components/game/graveyard-sheet.tsx` | Bottom sheet with drag handle. Uses `AvatarCircle`, `Badge`. |
| 2.21 | `EliminationCard` | `components/game/elimination-card.tsx` | Death announcement. Uses `AvatarCircle`, `Icon`. |
| 2.22 | `InvestigationLog` | `components/game/investigation-log.tsx` | Glass panel with scrollable entries. Uses `Badge`. |
| 2.23 | `GameReportRow` | `components/game/game-report-row.tsx` | Table row. 4 variants. Uses `AvatarCircle`, `Badge`. |
| 2.24 | `UserStatusCard` | `components/game/user-status-card.tsx` | Floating profile card. Uses `AvatarCircle`. |
| 2.25 | `SettingsPanel` | `components/game/settings-panel.tsx` | Config sliders extracted from LobbyView. |
| 2.26 | `RevengePanel` | `components/game/revenge-panel.tsx` | Compact revenge selection. Uses `AvatarCircle`, `PrimaryButton`. |

---

## Per-Component Specification

> Each component spec references its corresponding `/design-analysis/components/{Name}.md` file. Agents should read that file for full variant details, exact Tailwind classes, and visual behavior.

### 2.1 `Icon` (`components/ui/icon.tsx`)

- Props: `name: string`, `variant?: "regular" | "round" | "outlined"`, `size?: "sm" | "md" | "lg" | "xl"`, `className?: string`
- Renders: `<span className={materialIconClass}>{name}</span>`
- Size map: sm=16px, md=20px, lg=24px, xl=32px
- Reference: `design-analysis/theme.md` § 2.2

### 2.2 `Badge` (`components/ui/badge.tsx`)

- 8 variants via CVA: `vote-count`, `you`, `host`, `phase`, `status`, `player-count`, `investigation-result`, `notification`
- Reference: `design-analysis/components/Badge.md`

### 2.3 `Divider` (`components/ui/divider.tsx`)

- 4 variants: `text`, `gradient`, `icon`, `plain`
- Reference: `design-analysis/components/Divider.md`

### 2.4 `TextInput` (`components/ui/text-input.tsx`)

- Props: `icon`, `placeholder`, `value`, `onChange`, `error`, `success`, `maxLength`, `showCounter`, `variant?: "default" | "code"`, `className`
- Code variant: centered, monospace, `tracking-[0.5em]`, maxlength 6, auto-uppercase
- Reference: `design-analysis/components/TextInput.md`

### 2.5 `StepIndicator` (`components/ui/step-indicator.tsx`)

- Props: `currentStep: number`, `totalSteps: number`
- Reference: `design-analysis/components/StepIndicator.md`

### 2.6 `SuggestedChips` (`components/ui/suggested-chips.tsx`)

- Props: `suggestions: string[]`, `onSelect: (value: string) => void`
- Reference: `design-analysis/components/SuggestedChips.md`

### 2.7 `PrimaryButton` (`components/ui/primary-button.tsx`)

- Props: `icon?: string`, `iconPosition?: "start" | "end"`, `variant?: "primary" | "danger"`, `loading?: boolean`, `shimmer?: boolean`, `fullWidth?: boolean`, `children`, `disabled`, standard button props
- Must keep existing `Button` component alive until all consumers are migrated in Phase 3
- Reference: `design-analysis/components/PrimaryButton.md`

### 2.8 `SecondaryButton` (`components/ui/secondary-button.tsx`)

- 6 variants: `outline`, `ghost`, `oauth`, `dashed`, `text-link`, `danger-text`
- Reference: `design-analysis/components/SecondaryButton.md`

### 2.9 `AvatarCircle` (`components/ui/avatar-circle.tsx`)

- Wraps existing `UserAvatar` image/initial logic
- 8 visual states via props: `showOnline`, `glow`, `selected`, `dead`, `editable`, `glowWrapper`, `size`
- Reference: `design-analysis/components/AvatarCircle.md`

### 2.10 `TimerDisplay` (`components/ui/timer-display.tsx`)

- 5 variants: `circle`, `ring`, `inline`, `progress-bar`, `compact`
- Reuse `formatTime()` and countdown logic from existing `PhaseTimer`
- SVG ring: `stroke-dasharray` / `stroke-dashoffset` for circular progress
- Reference: `design-analysis/components/TimerDisplay.md`

### 2.11 `LanguageSwitcher` (`components/language-switcher.tsx`)

- Rebuild as pill toggle: two buttons side-by-side, active has `bg-primary`, inactive has `bg-white/5`
- Globe icon variant for header usage
- Keep same routing logic (`router.replace`)
- Reference: `design-analysis/components/LanguageSwitcher.md`

### 2.12 `PlayerCard` (`components/ui/player-card.tsx`)

- **Most complex component**. 10 variants via `variant` prop (CVA):
  - `game-phase` (default), `selected`, `self`, `speaking`, `voting`, `mafia-target`, `ability`, `protection`, `dead`, `lobby`
- Composes: `AvatarCircle`, `Badge`, `Icon`
- Reference: `design-analysis/components/PlayerCard.md` (read carefully — each variant has unique styling rules)

### 2.13 `PlayerGrid` (`components/ui/player-grid.tsx`)

- Refactor from monolithic component to layout wrapper
- Props: `columns?: 2 | 3 | 4`, `gap?: "sm" | "md"`, `children: ReactNode`
- Remove embedded player card rendering (delegate to `PlayerCard`)
- Reference: `design-analysis/components/PlayerGrid.md`

### 2.14 `PhaseHeader` (`components/game/phase-header.tsx`)

- 6 variants: `standard`, `discussion`, `voting`, `ability-left`, `ability-split`, `mafia-night`
- Each variant has distinct layout (centered vs. left-aligned vs. split)
- Uses `Badge`, `TimerDisplay`, `Icon`
- Reference: `design-analysis/components/PhaseHeader.md`

### 2.15–2.26: See component reference docs

Each remaining component follows its `/design-analysis/components/{Name}.md` specification. Props, variants, and styling are fully documented there.

---

## Files Changed (Summary)

| Action | Files |
|---|---|
| **New** | `icon.tsx`, `badge.tsx`, `divider.tsx`, `text-input.tsx`, `step-indicator.tsx`, `suggested-chips.tsx`, `primary-button.tsx`, `secondary-button.tsx`, `avatar-circle.tsx`, `timer-display.tsx`, `player-card.tsx`, `bottom-navigation.tsx`, `bottom-action-bar.tsx`, `room-code-card.tsx`, `waiting-overlay.tsx`, `role-reveal-card.tsx`, `graveyard-sheet.tsx`, `elimination-card.tsx`, `investigation-log.tsx`, `game-report-row.tsx`, `user-status-card.tsx`, `settings-panel.tsx`, `revenge-panel.tsx` |
| **Rebuild** | `language-switcher.tsx`, `phase-header.tsx` |
| **Refactor** | `player-grid.tsx` (extract card, simplify to layout wrapper) |
| **Keep (deprecated)** | `button.tsx`, `role-card.tsx`, `phase-timer.tsx`, `player-avatar.tsx`, `user-avatar.tsx` — keep alive until Phase 3 migrates all consumers |

---

## Acceptance Criteria (Phase-Level)

- [ ] All 25 components render correctly in isolation (recommend Storybook or a `/dev` page)
- [ ] Every component respects theme switching (`data-theme="mafia"` swaps to red palette)
- [ ] Every component supports RTL layout (flex direction, margin/padding use `ms-`/`me-`/`ps-`/`pe-`)
- [ ] All text content uses `useTranslations()` — no hardcoded English strings
- [ ] TypeScript strict mode passes with no errors
- [ ] Components that need animation (shimmer, float, pulse) render animations smoothly

---

## Risks & Ambiguities

| Risk | Mitigation |
|---|---|
| Extracting `PlayerCard` from `PlayerGrid` changes the prop interface for all game phase components | Keep old `PlayerGrid` working until Phase 3 screen migration. Build new components alongside old ones. |
| 10 `PlayerCard` variants is complex — risk of inconsistent implementation | Use CVA with a clear variant matrix. Each variant should be a named Tailwind `compoundVariants` rule. |
| `SettingsPanel` and `RevengePanel` extraction from inline code requires understanding game logic | Only extract the UI shell — keep mutation logic in the screen component. Panel is purely presentational. |
| `RoleRevealCard` 3D flip may have cross-browser issues | Test on Chrome, Safari, Firefox. Safari may need `-webkit-` prefixes for `perspective` / `backface-visibility`. |
| Old `Button` component is used across auth, onboarding, game pages | Keep it alive. Phase 3 will do the migration pass. |
