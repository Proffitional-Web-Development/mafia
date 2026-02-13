# Component: GraveyardSheet

> Bottom sheet showing eliminated players. Appears during game phases.

---

## Visual Design

- Container: `bg-surface-darker/95 backdrop-blur-md border-t border-white/5 rounded-t-2xl`
- Shadow: `shadow-[0_-5px_20px_rgba(0,0,0,0.4)]`
- Padding: `px-6 pt-4 pb-8`
- Drag handle: `w-12 h-1 bg-white/10 rounded-full mx-auto mb-4`
- Header row: Title ("Graveyard") + count ("0 Eliminated")

### Empty State
- Dashed border container: `border-2 border-dashed border-white/5 rounded-lg bg-white/5 h-16`
- Text: `text-xs text-slate-500 italic` — "No casualties yet..."

### Populated State
- Horizontal scroll: `flex gap-4 overflow-x-auto`
- Dead player mini: `w-10 h-10 rounded-full opacity-50 grayscale`
- X badge: `absolute -bottom-1 -right-1 bg-red-900 rounded-full`
- Name: `text-[10px] text-slate-500`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `eliminatedPlayers` | Player[] | List of dead players |
| `roundLabel` | string | E.g., "Round 1" |

---

## Screens Where Used

| Screen |
|---|
| Discussion Phase |
