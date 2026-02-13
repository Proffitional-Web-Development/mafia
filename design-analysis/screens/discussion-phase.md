# Screen: Discussion Phase

> Daytime discussion round where all alive players communicate.

---

## Screen Purpose

Primary discussion interface. Shows all alive players in a grid with speaking indicators, a countdown timer, and graveyard panel. Room owner can end discussion early.

---

## Component Composition

| Component | Usage |
|---|---|
| `PhaseHeader (discussion)` | Phase badge, title "Discussion Round N", circular timer, description |
| `TimerDisplay (circle)` | Centered countdown with pulse ring |
| `Badge (status)` | "Live Phase" badge, "Global Chat" label |
| `PlayerCard (default)` | Alive players in 2-col grid |
| `PlayerCard (speaking)` | Active speaker with pulsing indicator |
| `PlayerCard (self)` | Current player with "YOU" badge |
| `PrimaryButton` | "End Discussion Early" (owner only, outlined variant) |
| `GraveyardSheet` | Bottom sheet with eliminated players |

---

## Layout Notes

- **Header**: Gradient fade from background-dark to transparent
  - Badge: "Global Chat" + "Live Phase"
  - Title: "Discussion Round 1"
  - Timer: Centered circular timer with ambient glow
  - Description: centered text
- **Main grid**: 2-col player cards, scrollable
- **Bottom stack**:
  1. Owner CTA button (outline style with `gavel` icon)
  2. Graveyard bottom sheet (rounded-t-2xl) with drag handle
- **Background blobs**: Purple (top-right) + blue (bottom-left)

---

## Unique Requirements

- Real-time speaking indicator (pulsing dot on active speaker's card)
- Timer synced across all clients (server authority)
- Owner has "End Discussion Early" button (others don't see it)
- Graveyard grows as game progresses (empty in round 1)
- Round number increments per game day
- Player cards show no action/tap behavior (display only during discussion)

---

## Open Questions / Ambiguities

1. Is "speaking" indicator based on actual voice chat or text-based indication?
2. How is the active speaker determined (turn-based or free-form)?
3. Can players type messages during discussion or is it voice only?
4. Graveyard sheet — is it expandable/draggable or static?

---

## Dependencies

- `PhaseHeader`, `TimerDisplay`, `Badge`, `PlayerCard`, `PrimaryButton`, `GraveyardSheet`
- Real-time game state subscription
- Timer synchronization
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build header with discussion phase layout
- [ ] Reuse `TimerDisplay (circle)` with pulse animation
- [ ] Build 2-col player grid with player card variants
- [ ] Implement speaking indicator animation
- [ ] Build "YOU" card variant
- [ ] Reuse `GraveyardSheet` (empty + populated states)
- [ ] Conditionally render owner "End Discussion" button
- [ ] Subscribe to real-time game state
- [ ] Sync timer with server
- [ ] Add i18n for all text
