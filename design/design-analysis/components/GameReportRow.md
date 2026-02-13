# Component: GameReportRow

> Individual row in the game-over results table showing a player's role and status.

---

## Visual Variants

### 1. Alive Player (Citizen Team)
- Container: `bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-transparent hover:border-white/10`
- Avatar: `w-10 h-10 rounded-full border border-white/10`
- Name: `font-semibold text-sm text-white`
- Role: `text-xs text-primary font-medium`
- Status: green dot `w-2 h-2 bg-green-500 animate-pulse` + "Alive" span

### 2. Dead Mafia Player
- Container: `bg-red-900/10 hover:bg-red-900/20 p-3 rounded-lg border border-red-500/10`
- Avatar: `grayscale border border-red-500/30`
- Name: `text-red-200 line-through decoration-red-500/50`
- Role: `text-xs text-red-400`
- Status: skull icon + "Dead (Day 3)" in red

### 3. Self Row (Highlighted)
- Container: `bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]`
- Avatar: `border-2 border-emerald-500`
- Name: "You" in `text-white`
- Role: `text-emerald-400`
- Status: green dot

### 4. Dead Citizen
- Container: `bg-gray-800/30 opacity-70 p-3 rounded-lg border border-white/5`
- Avatar: `grayscale`
- Name: `text-gray-400 line-through`
- Role: `text-gray-500`
- Status: skull icon + "Dead (Night 1)" in gray

---

## Props

| Prop | Type | Description |
|---|---|---|
| `player` | Player | Name, avatar |
| `role` | string | Display role name |
| `team` | `"town"` \| `"mafia"` | Faction |
| `isSelf` | boolean | Highlight row |
| `isAlive` | boolean | Alive/dead status |
| `eliminationInfo` | string \| null | "Day 3", "Night 1", etc. |

---

## Screens Where Used

| Screen |
|---|
| Game Over Results Screen |
