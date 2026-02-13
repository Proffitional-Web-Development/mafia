# Component: PlayerGrid

> Grid layout container for displaying players in various phases. Not a standalone component — wraps PlayerCard instances.

---

## Visual Variants

| Layout | Columns | Gap | Context |
|---|---|---|---|
| Discussion/Voting | `grid-cols-2` | `gap-3` to `gap-4` | Discussion, public voting, mafia voting, boy revenge, girl protection |
| Ability (Sheikh) | `grid-cols-3` | `gap-3` | Sheikh investigation |
| Lobby | `grid-cols-4` | `gap-4` | Room lobby (with empty slots) |
| Survivor Status | `grid-cols-4` | `gap-3` | Morning resolution (compact) |
| Avatar Presets | `grid-cols-4` | `gap-4` | Avatar selection |

---

## Container Properties

- Wrapper: `overflow-y-auto` with hidden scrollbar utility
- Padding bottom: `pb-32` or `pb-24` to avoid overlap with fixed bottom bar
- Max width: `max-w-md mx-auto`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `columns` | `2` \| `3` \| `4` | Grid column count |
| `gap` | `3` \| `4` | Grid gap |
| `children` | ReactNode | PlayerCard instances |

---

## Screens Where Used

Every game-phase screen and the lobby.
