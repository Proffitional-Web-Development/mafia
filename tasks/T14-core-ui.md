# T14 — Core UI Pages & Components

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Priority** | P0 |
| **Complexity** | XL |
| **Dependencies** | T04, T05, T06 |

## Description

Build all core pages and reusable components for the game UI.

## Pages

1. **Home / Landing Page**
   - Logo, game title, tagline
   - "Create Room" and "Join Room" CTAs
   - Language switcher
   - User avatar + username in header

2. **Auth Pages**
   - Login form (email + password, OAuth buttons)
   - Signup form (email, password, username, avatar upload)
   - Consistent auth layout

3. **Lobby Page** (covered in T06, UI polish here)
   - Player grid with join animations
   - Settings panel (owner)
   - Start game button

4. **Game Board Page** (main game screen)
   - Phase indicator (current phase name + icon)
   - Round counter
   - Player circle/grid (alive/dead visual states)
   - Role badge (own role, persistent but discreet)
   - Phase-specific action panels (voting, abilities, waiting)
   - Timer display
   - Eliminated players sidebar/graveyard

5. **Game Over Page** (covered in T13, UI polish here)

## Reusable Components

6. `<PlayerAvatar />` — avatar + name + status (alive/dead/voting)
7. `<PhaseTimer />` — countdown with urgency states
8. `<VoteButton />` — selectable player target
9. `<RoleCard />` — flip-reveal card with role info
10. `<PhaseTransition />` — full-screen overlay for phase changes
11. `<ConfirmDialog />` — reusable confirmation modal
12. `<PlayerGrid />` — responsive grid of player avatars
13. `<StatusBanner />` — "You are dead — Spectating" banner

## Design System

14. Define color palette (faction colors, phase colors, colorblind-safe)
15. Typography scale (supports Arabic + English fonts)
16. Spacing and layout tokens
17. Dark theme (primary) with optional light theme

## Acceptance Criteria

- [ ] All pages render without errors
- [ ] Navigation between pages works (Next.js routing)
- [ ] Components are reusable and typed (TypeScript props)
- [ ] Responsive on mobile (360px+) and desktop
- [ ] Colorblind-safe palette verified
- [ ] Dark theme applied consistently
- [ ] All text uses i18n translation keys
