# Screen: Game Over Results

> End-of-game results screen showing the winning team and complete player report.

---

## Screen Purpose

Final screen after a game ends. Announces the winning team, shows the current player's result, and provides a full player report table with roles revealed.

---

## Component Composition

| Component | Usage |
|---|---|
| `Badge` | Team faction icon, phase label |
| `AvatarCircle` | Personal result card icon + report row avatars |
| `GameReportRow` | Scrollable list of all players with roles/statuses |
| `PrimaryButton` | "Play Again" (owner) |
| `SecondaryButton (ghost)` | "Leave Game" |

---

## Layout Notes

- **Winner Announcement** (header):
  - Abstract purple glow background (blur-[60px])
  - Large faction icon: `w-24 h-24 rounded-full gradient from-primary to-purple-900 border-4 border-white/10`
    - Icon: `shield` (town) or role-specific
  - Title: "Winner: Citizens" — gradient text, `text-3xl font-bold uppercase`
  - Sub-label: Game # + "Ended"
- **Personal Result Card**:
  - `bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4`
  - Left: Role icon container (`bg-emerald-500/20 border border-emerald-500/30`)
  - Right: Victory/Defeat label + "You were the **Sheikh**" + team summary
  - Color-coded: emerald for victory, red for defeat (inferred)
- **Game Report Table**: Scrollable list
  - Header: "Game Report" + player count badge
  - `GameReportRow` instances for each player (see component doc)
  - Ally row highlighted, dead rows dimmed/red, mafia rows red-tinted
- **Bottom bar**: Fixed with backdrop blur
  - "Play Again" primary button + "Leave Game" ghost button

---

## Unique Requirements

- All roles revealed (secret information disclosed)
- Color coding by team (town = emerald/green, mafia = red)
- Personal result card changes based on win/loss
- Victory/Defeat conditional rendering and color
- Owner-only "Play Again" or accessible to all?
- Death timeline info per player (e.g., "Dead (Day 3)", "Dead (Night 1)")
- Scrollable report with multiple row variants

---

## Open Questions / Ambiguities

1. Is "Play Again" owner-only or available to all?
2. Does "Play Again" create a new room or restart with same settings?
3. Is there a statistics/XP screen after this?
4. Are there game stats shown (e.g., total nights, total votes)?
5. What does the defeat version look like? (Color swap to red?)

---

## Dependencies

- `AvatarCircle`, `GameReportRow`, `PrimaryButton`, `SecondaryButton`
- Game results data (Convex query — all roles, statuses, death info)
- Theme tokens (purple base + semantic colors)
- i18n strings

---

## Implementation Checklist

- [ ] Build winner announcement header with gradient text + faction icon
- [ ] Build personal result card with conditional win/loss styling
- [ ] Build scrollable game report table
- [ ] Reuse `GameReportRow` with 4 variants (alive-town, dead-mafia, self, dead-citizen)
- [ ] Build bottom action bar with Play Again + Leave Game
- [ ] Wire up game results query
- [ ] Handle "Play Again" room restart logic
- [ ] Handle "Leave Game" navigation
- [ ] Add i18n for all text
