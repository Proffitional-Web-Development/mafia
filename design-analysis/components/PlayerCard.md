# Component: PlayerCard

> Card displaying a player's avatar, name, and contextual status. The most frequently reused component across game screens.

---

## Visual Variants

### 1. Game Phase Card (2-col grid)
- Container: `bg-surface-dark border border-white/5 rounded-xl p-3`
- Avatar: `w-14 h-14 rounded-full` with gradient bg
- Name: `font-medium text-sm text-slate-200`
- Status line: text-[10px] (e.g., "Speaking", empty, role tag)
- Layout: vertical `flex-col items-center gap-2`

### 2. Selected Card (2-col)
- Border: `border-2 border-primary` with `shadow-glow`
- Scale: `scale-[1.02]`
- Check icon: `absolute top-2 right-2` — Material `check_circle`
- Name color: `text-primary`

### 3. "You" Card
- Badge: `absolute top-0 right-0` — "YOU" label
- Border: `border border-primary/50`
- Background pattern: carbon fibre texture
- Avatar ring: `ring-2 ring-primary/30`
- Name color: `text-primary`

### 4. Speaking Card
- Pulsing indicator: `absolute top-2 right-2` with `animate-ping`
- Border: `border-2 border-primary`
- Status: mic icon + "Speaking" in primary color
- Avatar border: `border-2 border-primary`

### 5. Voting Card (Public Voting)
- Vote badge: `absolute -top-1 -right-1` — circle with count
- Vote badge colors: `bg-primary` (low), `bg-red-500` (high, with `animate-bounce`)
- Voters row: stacked mini avatars (`flex -space-x-2`)
- Selected state: `border-2 border-primary shadow-glow`

### 6. Mafia Target Card
- Full image: `aspect-square w-full`
- Selected: `border-2 border-primary` with red gradient overlay
- Unselected: `grayscale hover:grayscale-0`
- Vote indicators: mini avatars at bottom-left
- Selected footer: `bg-primary` with "Target Locked"

### 7. Ability Phase Card (3-col, compact)
- Container: `rounded-xl bg-neutral-dark border border-white/5 p-3`
- Avatar: `w-12 h-12 rounded-full`
- Name: `text-xs font-medium`
- Selected: `bg-primary/20 border-2 border-primary` with checkmark

### 8. Protection Card (Girl ability)
- Selected: green border (`border-2 border-success-glow`) with shield icon
- Status line: "Protecting" in green
- Normal: grayscale avatar → color on hover

### 9. Dead / Disabled Card
- `opacity-50 grayscale cursor-not-allowed`
- X overlay on avatar or "Eliminated" badge
- Name: `line-through text-gray-600`

### 10. Lobby Player Slot
- Avatar: `w-16 h-16 rounded-full` with border
- Owner badge: gold star (`bg-yellow-500`)
- "YOU" badge: purple pill (`bg-primary`)
- Empty slot: `border-2 border-dashed border-gray-500 opacity-30`

---

## Props / States

| Prop | Type | Description |
|---|---|---|
| `player` | Player object | Name, avatar, id |
| `variant` | `"default"` \| `"voting"` \| `"mafia-target"` \| `"ability"` \| `"lobby"` \| `"protection"` | Layout variant |
| `isSelected` | boolean | Selection state |
| `isSelf` | boolean | Show "YOU" badge |
| `isOwner` | boolean | Show host/star badge |
| `isSpeaking` | boolean | Pulsing indicator |
| `isDead` | boolean | Grayscale + disabled |
| `voteCount` | number | Vote badge |
| `voters` | Player[] | Mini avatar row |
| `status` | string | Status text ("Speaking", "Target Locked", "Protecting", etc.) |
| `onClick` | function | Tap handler (vote/select) |

---

## Screens Where Used

| Screen | Variant | Grid |
|---|---|---|
| Discussion Phase | game-phase (default, speaking, self) | 2-col |
| Public Voting | voting | 2-col |
| Mafia Voting | mafia-target | 2-col |
| Sheikh Ability | ability (compact) | 3-col |
| Boy Revenge | ability-danger | 2-col |
| Girl Protection | protection | 2-col |
| Room Lobby | lobby | 4-col |
| Morning Resolution | survivor-mini | 4-col |
| Game Over | report-row (different layout) | list |
