# Screen: Girl Protection Ability Phase

> Night phase where the "Girl" role selects a player to protect from Mafia attack.

---

## Screen Purpose

Role-specific screen. The Girl chooses one player to shield tonight. If the Mafia targets that player, they survive. Uses green accent for protection theme.

---

## Component Composition

| Component | Usage |
|---|---|
| `PhaseHeader (ability-split)` | Role badge (floating animated), title + timer split layout |
| `TimerDisplay (compact)` | Right-aligned timer with progress bar |
| `Badge (role)` | "The Girl" floating pill with medical icon |
| `PlayerCard (protection)` | 2-col grid with green protection selection |
| `PrimaryButton` | "Protect [Name]" with `local_hospital` icon |
| `WaitingOverlay` | Success confirmation modal (hidden state, shows after submit) |

---

## Layout Notes

- **Background**: Purple blur blobs + stardust texture
- **Header**:
  - Role badge: `bg-neutral-surface/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/30`
    - Medical icon + "The Girl" text, `animate-float`
  - Left: "Night Phase" title + "Use your ability wisely"
  - Right: "Time Left" label + `00:15` timer
  - Progress bar: full-width below
- **Instructions**: Centered text "Choose a player to protect tonight"
- **Grid**: 2-col cards
  - Selected: Green border (`border-success-glow`) + shield icon badge (bouncing) + "Protecting" status ✅
  - Default: Neutral, grayscale avatar → color on hover
  - Self ("You"): "You" badge top-left
  - Dead ("Eliminated"): Grayscale + blur + "Eliminated" overlay badge + `cursor-not-allowed`
- **Bottom CTA**: Fixed gradient fade, "Protect [Name]" button

### Success Modal (Hidden)
- Full-screen overlay with spinning check icon
- "Protection Submitted" title
- "Waiting for other players..." message
- Pulsing loading dot

---

## Unique Requirements

- Green accent color for protection (success-glow `#22c55e`)
- Floating animated role badge
- Shield icon with bounce animation on selected card
- Cannot protect self (implied by design — self card shown but presumably disabled)
- Cannot protect dead players
- Success modal after submission
- Progress bar timer

---

## Open Questions / Ambiguities

1. Can the Girl protect herself?
2. Can the Girl protect the same player on consecutive nights?
3. Is the success modal dismissible or auto-closes?
4. What happens on timer expiry — random protection or none?

---

## Dependencies

- `PhaseHeader`, `TimerDisplay`, `Badge`, `PlayerCard`, `PrimaryButton`, `WaitingOverlay`
- Protection mutation (Convex)
- Theme tokens (purple base + green accent)
- i18n strings

---

## Implementation Checklist

- [ ] Build header with floating role badge + split title/timer layout
- [ ] Build progress bar timer
- [ ] Build instruction section
- [ ] Build 2-col player grid with protection variant
- [ ] Implement green selection state (shield, "Protecting" label)
- [ ] Handle dead player disabled state
- [ ] Handle self-protection rule
- [ ] Build success modal overlay
- [ ] Wire up protection mutation
- [ ] Handle timer expiry
- [ ] Show waiting overlay for non-Girl players
- [ ] Add i18n for all text
