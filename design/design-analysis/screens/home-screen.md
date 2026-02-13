# Screen: Mafia Game Home Screen

> Main landing/home screen after authentication. Entry point to game flows.

---

## Screen Purpose

Central hub showing user identity, hero illustration, and primary CTA to enter the game lobby. Also includes bottom navigation for app-level navigation.

---

## Component Composition

| Component | Usage |
|---|---|
| `LanguageSwitcher` | Pill toggle (EN/AR) in header |
| `UserStatusCard` | Floating card overlay on hero image |
| `PrimaryButton` | "Go to Game" CTA (danger/red variant) |
| `BottomNavigation` | 3-tab nav (Home active, Profile, Settings) |

---

## Layout Notes

- **Container**: Full-height, `max-w-md`, transparent bg on `z-10`
- **Background**: Full-bleed background image (noir smoke) with `mix-blend-overlay` + gradient overlay
- **Header**: Spacer left + LanguageSwitcher right
- **Hero section**:
  - Logo: `text-5xl font-black uppercase` — "Mafia **Game**" (Game in red)
  - Tagline: "Trust No One" in `tracking-[0.2em] text-slate-400 uppercase`
  - Decorative gradient line below
- **Illustration**: `aspect-square max-w-[280px]` with glow, grayscale → color on hover
- **UserStatusCard**: Positioned absolute bottom of illustration
- **CTA**: Full-width red button at bottom with online player count
- **Bottom Nav**: Fixed

---

## Unique Requirements

- **Different color theme**: Uses `#f20d33` red primary (not purple)
- **Different font**: Uses `Be Vietnam Pro` instead of `Space Grotesk`
- Hero image with grayscale filter that removes on hover
- Online player count indicator below CTA
- Ambient smoke background image with blend mode
- User online status (green dot)

---

## Open Questions / Ambiguities

1. Should this screen use the same font as all others, or maintain `Be Vietnam Pro`?
2. Is the online player count real-time? How is it sourced?
3. What does "Go to Game" navigate to — lobby or create/join screen?
4. Is the hero illustration a static asset or dynamically assigned?
5. Should Profile and Settings tabs navigate to real screens?

---

## Dependencies

- `LanguageSwitcher`, `UserStatusCard`, `PrimaryButton`, `BottomNavigation` components
- User profile data (name, avatar, online status)
- Theme tokens (red variant for this screen)
- i18n strings
- Background image asset

---

## Implementation Checklist

- [ ] Build page layout with full-bleed background
- [ ] Implement red theme context/override for this screen
- [ ] Build logo/tagline section
- [ ] Build hero illustration card with hover effect
- [ ] Reuse `UserStatusCard` (floating)
- [ ] Reuse `LanguageSwitcher` (pill variant)
- [ ] Reuse `PrimaryButton` (red/danger variant)
- [ ] Reuse `BottomNavigation` (Home active)
- [ ] Add online player count (real-time or polling)
- [ ] Add i18n for all text
