# Screen: Morning Resolution

> Morning phase showing the results of the previous night's events.

---

## Screen Purpose

Transitional screen displayed at the start of each day. Announces who was eliminated overnight (if anyone), shows optional Boy revenge panel, and displays all player statuses.

---

## Component Composition

| Component | Usage |
|---|---|
| `EliminationCard` | Central card showing eliminated player with death X overlay |
| `RevengePanel` | Conditional panel for Boy's revenge opportunity |
| `PlayerCard (survivor-mini)` | 4-col compact grid showing all player statuses |
| `AvatarCircle` | Per-player mini avatars (w-14 h-14) in rounded squares |
| `Badge` | "YOU" badge, online dot, death indicators |

---

## Layout Notes

- **Background blobs**: Centered purple blur (top) + corner blur (bottom-right)
- **Header**: Sun icon in yellow circle + "Morning has broken" title (with text glow) + day/phase label
- **Elimination Card**: Glass-panel card with red top border
  - Avatar: `w-24 h-24 grayscale` with X overlay
  - Name: red text
  - Cause: "was eliminated by the **Mafia**"
- **Revenge Panel** (conditional):
  - Red/purple gradient card with fire icon
  - Timer + description
  - Mini target carousel (horizontal scroll of avatars)
  - Selected target: red border + checkmark
- **Survivor Status Grid**: 4-col, compact
  - Alive: Primary border, green online dot
  - Self: Yellow border + "YOU" badge (top-center)
  - Dead (old): Grayscale + skull overlay + strikethrough name
  - Newly dead: Red grayscale border + X overlay + red name
- **Bottom bar**: Fixed progress bar ("Preparing next phase... 75%")

---

## Unique Requirements

- Conditional rendering: elimination card only if someone died
- Conditional rendering: revenge panel only if eliminated player is Boy role
- "No one was eliminated" alternative state (protection saved them)
- Progress bar for next phase loading
- Multiple player status variants in compact grid
- Day counter tracking

---

## Open Questions / Ambiguities

1. What is shown if no one was eliminated (Girl protected the target)?
2. Does the revenge panel appear inline or as a modal/overlay?
3. How long is this screen shown before auto-advancing?
4. Is there an "acknowledged" action or is it timed?

---

## Dependencies

- `EliminationCard`, `RevengePanel`, `PlayerCard`, `AvatarCircle`, `Badge`
- Night resolution data (Convex query)
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build header with sun icon and "Morning has broken" title
- [ ] Build `EliminationCard` component
- [ ] Build `RevengePanel` component (conditional)
- [ ] Build 4-col survivor status grid
- [ ] Implement alive/dead/self/new-dead player avatar states
- [ ] Build bottom progress bar for phase transition
- [ ] Handle "no elimination" alternative state
- [ ] Subscribe to morning resolution data
- [ ] Handle auto-advance timing
- [ ] Add i18n for all text
