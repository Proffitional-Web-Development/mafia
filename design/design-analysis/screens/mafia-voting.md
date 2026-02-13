# Screen: Mafia Voting Phase

> Night phase where Mafia members vote on which player to eliminate.

---

## Screen Purpose

Secret Mafia-only voting screen. Mafia members choose a target to kill. Teammate votes are visible. Non-mafia players see a waiting overlay.

---

## Component Composition

| Component | Usage |
|---|---|
| `PhaseHeader (mafia-night)` | Night phase moon icon + title + timer + progress bar |
| `TimerDisplay (inline)` | Timer with progress bar |
| `PlayerCard (mafia-target)` | 2-col grid with full-image cards, grayscale → color |
| `Badge` | Teammate vote indicators |
| `PrimaryButton` | "Confirm Kill on [Name]" (danger/red variant) |
| `WaitingOverlay` | Moon + "The night is quiet..." (for non-mafia) |

---

## Layout Notes

- **Theme**: Red/danger variant (`#ec1313` primary, `#221010` background)
- **Background**: Crosshair pattern + red vignette gradient
- **Header**: Moon icon + "Night Phase" badge + inline timer + "Choose a victim"
- **Grid**: 2-col cards with full-image, aspect-square
  - Selected: Red border + gradient overlay + "Target Locked" footer + check icon
  - Unselected: Grayscale with subtle border, color on hover
  - Teammate voted: Primary/40 border + "Don's Vote" indicator badge
  - Standard citizen label below image
- **Floating chat**: `absolute bottom-36 right-6` chat bubble with notification dot
- **Bottom bar**: Fixed, rounded-t-2xl
  - Warning: eye icon + "Keep this decision private..." text
  - Danger CTA: "Confirm Kill on Alice" with `my_location` icon + shimmer
- **Footer note**: Subtle safety message about privacy

---

## Unique Requirements

- **Red theme override**: Entire screen uses red palette instead of purple
- Crosshair background pattern (CSS radial-gradient)
- Full-image player cards (portrait photos, aspect-square)
- Grayscale filter on unselected → removes on hover
- Mafia teammate vote visibility (shows who they voted for)
- Private vote (only mafia can see each other's votes)
- Chat button with unread notification count
- Shimmer animation on CTA button

---

## Open Questions / Ambiguities

1. How is Mafia-only chat implemented? Separate channel?
2. Can Mafia change their vote?
3. How are vote conflicts resolved (if mafia members vote differently)?
4. Is the floating chat button a full chat UI or quick message?

---

## Dependencies

- `PhaseHeader`, `TimerDisplay`, `PlayerCard`, `Badge`, `PrimaryButton`, `WaitingOverlay`
- Mafia vote mutation (Convex)
- Mafia teammate state subscription
- Red theme tokens
- i18n strings

---

## Implementation Checklist

- [ ] Apply red theme override for this screen
- [ ] Build crosshair background pattern
- [ ] Build header with night phase styling
- [ ] Build full-image player card grid (mafia-target variant)
- [ ] Implement teammate vote indicators
- [ ] Implement grayscale → color hover effect
- [ ] Build floating chat button with notification badge
- [ ] Build bottom action bar with privacy warning
- [ ] Wire up vote selection and confirm mutation
- [ ] Show `WaitingOverlay` for non-mafia players
- [ ] Add i18n for all text
