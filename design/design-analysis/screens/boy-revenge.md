# Screen: Boy Revenge Ability Phase

> Post-elimination ability where the "Boy" role selects a player for revenge.

---

## Screen Purpose

When a player with the "Boy" role is eliminated, they get one chance to take another player down with them. Urgent timed selection screen.

---

## Component Composition

| Component | Usage |
|---|---|
| `TimerDisplay (ring)` | SVG ring timer, centered in header |
| `PlayerCard (ability-danger)` | 2-col grid with crosshair overlay on selected |
| `Badge` | X mark on selected card, "Target Locked" label |
| `PrimaryButton` | "USE REVENGE" (danger/red variant) with gavel icon |

---

## Layout Notes

- **Theme**: Red/danger variant (`#da0b0b` primary, `#221010` background)
- **Container**: Red pulse vignette border (`border-[8px] border-primary/20 rounded-[40px]`)
- **Radial danger gradient**: Subtle red vignette overlay
- **Status bar**: Mockup time + signal/wifi/battery (aesthetic only)
- **Header**: SVG ring timer (centered, `w-20 h-20`) + "Last Revenge!" title + description
- **Grid**: 2-col player cards
  - Selected: Red border + crosshair (`my_location`) overlay + X badge (top-right) + "Target Locked"
  - Default: Neutral border, `opacity-80 group-hover:opacity-100`
  - Status label: "Alive" under each name
- **Bottom CTA**: Fixed gradient fade, "USE REVENGE" red button + "IRREVERSIBLE ACTION" warning

---

## Unique Requirements

- **Red theme override** (like mafia voting)
- High urgency visual treatment (pulse vignette, red accents)
- Crosshair overlay icon on selected target
- "IRREVERSIBLE ACTION" warning text
- This only shows for the eliminated Boy player — all others see waiting overlay
- One-shot selection — cannot undo after confirm
- Timer pressure (short countdown)

---

## Open Questions / Ambiguities

1. How long is the revenge timer? (Design shows 24s)
2. What happens if timer expires without selection — skip or random?
3. Can the Boy see other night events (mafia vote results)?
4. Is this shown during night phase or as a special interrupt?

---

## Dependencies

- `TimerDisplay`, `PlayerCard`, `Badge`, `PrimaryButton`
- Revenge mutation (Convex)
- Red theme tokens
- i18n strings

---

## Implementation Checklist

- [ ] Apply red theme override
- [ ] Build vignette border + radial gradient overlay
- [ ] Build SVG ring timer (centered)
- [ ] Build 2-col player grid with crosshair selection
- [ ] Implement target selection with single-select behavior
- [ ] Build bottom CTA with irreversible warning
- [ ] Wire up revenge mutation
- [ ] Handle timer expiry
- [ ] Show waiting overlay for non-Boy players
- [ ] Add i18n for all text
