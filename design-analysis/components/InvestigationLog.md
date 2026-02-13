# Component: InvestigationLog

> History log showing previous night investigation results for the Sheikh role.

---

## Visual Design

- Container: `glass-panel rounded-xl` (frosted glass)
- Header: `bg-primary/10 px-4 py-2 border-b border-primary/10`
  - Title: `text-xs font-bold uppercase tracking-wider` — "Investigation Log"
  - Icon: `history` material icon
- Content: `max-h-24 overflow-y-auto p-2 space-y-2`

### Log Entry
- Container: `p-2 rounded bg-background-dark/50 border border-white/5`
- Layout: `flex items-center justify-between`
- Left: Night label (`N1`, `N2`) + player name (`text-sm text-gray-200`)
- Right: Result badge

### Result Badges
- **Innocent**: `bg-green-500/20 text-green-400 border border-green-500/30`
- **Mafia**: `bg-red-500/20 text-red-400 border border-red-500/30`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `entries` | `{ night: number, player: string, result: "innocent" \| "mafia" }[]` | History entries |

---

## Screens Where Used

| Screen |
|---|
| Sheikh Night Ability Phase |
