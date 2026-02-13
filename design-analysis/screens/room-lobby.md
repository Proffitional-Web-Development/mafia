# Screen: Room Lobby Waiting Area

> Pre-game lobby where players gather before the game starts.

---

## Screen Purpose

Waiting room after creating/joining a room. Shows room code, player roster, game configuration, and start/leave actions. Only the host can start the game.

---

## Component Composition

| Component | Usage |
|---|---|
| `RoomCodeCard` | Room code display with copy button |
| `PlayerCard (lobby)` | 4-col grid of joined players + empty slots |
| `AvatarCircle` | Per-player avatars (w-16 h-16) |
| `Badge (host)` | Gold star badge on host |
| `Badge (you)` | "YOU" pill on current user |
| `SettingsPanel` | Game rules configuration (sliders) |
| `PrimaryButton` | "Start Game" / "Waiting for players..." |
| `SecondaryButton (danger-text)` | "Leave Room" |

---

## Layout Notes

- **Header**: Logo icon (`casino` in primary square) + "Mafia Night" title + settings gear button
- **Room Code Card**: Full-width, centered code with copy button
- **Player Grid**: 4-col grid showing joined players + dashed empty slots
  - Host: primary border + gold star badge
  - Self: primary border + "YOU" pill + primary name color
  - Others: transparent border, gray names
  - Empty: dashed border, `opacity-30`, plus icon
- **Participants header**: Title + count badge ("4/12 Joined")
- **Settings**: Collapsed card with sliders (discussion duration, max players)
- **Quote**: Centered italic quote below settings
- **Bottom bar**: Fixed with Start Game button + Leave Room text

---

## Unique Requirements

- Room code copy-to-clipboard functionality
- Player grid dynamically fills as players join (real-time via Convex subscription)
- Start Game button: disabled until minimum players reached
- Settings only editable by host (read-only for others)
- Host indicator badge (gold star)
- Real-time player count update
- Leave Room confirmation (or instant leave)

---

## Open Questions / Ambiguities

1. Minimum player count to start game? (Design shows 4/12)
2. Can the host kick players?
3. Are settings locked once game starts vs. while waiting?
4. Is there a chat feature in the lobby?
5. What happens if the host leaves? (Transfer host or close room?)

---

## Dependencies

- `RoomCodeCard`, `PlayerCard`, `AvatarCircle`, `Badge`, `SettingsPanel`, `PrimaryButton`, `SecondaryButton`
- Real-time room state subscription (Convex)
- Room settings mutation (Convex)
- Clipboard API
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build page layout with scrollable content + fixed bottom
- [ ] Reuse `RoomCodeCard` with clipboard copy
- [ ] Build player grid (4-col) with dynamic slots
- [ ] Reuse `PlayerCard (lobby)` with host/self/empty variants
- [ ] Reuse `Badge` components (host star, YOU pill, player count)
- [ ] Reuse `SettingsPanel` with owner-only edit permissions
- [ ] Reuse `PrimaryButton` with disabled/enabled states
- [ ] Reuse `SecondaryButton (danger-text)` for Leave Room
- [ ] Subscribe to room state for real-time updates
- [ ] Wire up Start Game action (host only)
- [ ] Wire up Leave Room action
- [ ] Add i18n for all text
