# Screen: Sheikh Night Ability Phase

> Night phase where the Sheikh investigates a player's alignment.

---

## Screen Purpose

Role-specific night ability screen. The Sheikh selects one alive player to investigate, learning whether they are Innocent or Mafia. Includes a history log of past investigations.

---

## Component Composition

| Component | Usage |
|---|---|
| `PhaseHeader (ability-left)` | Night phase label, "Sheikh" title with star icon, SVG timer ring |
| `TimerDisplay (ring)` | SVG circle timer (top-right of header) |
| `PlayerCard (ability)` | 3-col compact grid with small avatars |
| `Badge` | Check mark on selected player |
| `InvestigationLog` | Glass panel with past night results |
| `PrimaryButton` | "INVESTIGATE @Name" with search icon |
| `WaitingOverlay` | For non-sheikh players (hidden by default) |

---

## Layout Notes

- **Header**: Left-aligned phase/role info + right-aligned SVG timer
  - Phase: `Night Phase 3` with pulsing dot
  - Role: "Sheikh" + stars icon (yellow)
- **Instructions**: Centered text + action pill badge (`visibility` icon + instruction)
- **Grid**: 3-col compact cards
  - Selected: `bg-primary/20 border-2 border-primary` + checkmark badge
  - Default: `bg-neutral-dark border border-white/5`
  - Dead: `opacity-50 grayscale cursor-not-allowed` + X overlay + strikethrough name
- **Investigation Log**: Glass-panel card below grid
  - Header with "Investigation Log" + history icon
  - Scrollable entries (max-h-24)
  - Each entry: Night label + player name + result badge (Innocent/Mafia)
- **Bottom CTA**: "INVESTIGATE @Name" with search icon

---

## Unique Requirements

- 3-column grid (more compact than voting — 6-7 players in view)
- Dead players shown but non-interactive
- Investigation log persists across nights
- Result badges: green "Innocent" / red "Mafia"
- Glass panel effect (backdrop-blur + semi-transparent bg)
- SVG ring timer with stroke-dashoffset for progress

---

## Open Questions / Ambiguities

1. Can the Sheikh investigate the same player twice?
2. Is the investigation result shown immediately or on the next morning?
3. Is the investigation log stored client-side or server-side?
4. Does timer auto-submit a random target or skip?

---

## Dependencies

- `PhaseHeader`, `TimerDisplay`, `PlayerCard`, `Badge`, `InvestigationLog`, `PrimaryButton`, `WaitingOverlay`
- Investigation mutation (Convex)
- Past investigation results query
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build left-aligned header with role info + right timer
- [ ] Build instruction section with action pill badge
- [ ] Build 3-col compact player grid
- [ ] Implement dead player card variant
- [ ] Build `InvestigationLog` glass panel component
- [ ] Reuse `PrimaryButton` with dynamic label
- [ ] Wire up player selection + investigation mutation
- [ ] Load and display past investigation results
- [ ] Show `WaitingOverlay` for non-sheikh players
- [ ] Add i18n for all text
