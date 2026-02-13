# Component: RevengePanel

> Compact inline panel shown on morning resolution screen when an eliminated "Boy" player has revenge opportunity.

---

## Visual Design

- Container: `bg-gradient-to-r from-red-900/40 to-primary/40 rounded-xl p-4 border border-red-500/50`
- Shadow: `shadow-[0_0_20px_rgba(220,38,38,0.2)]`
- Pulsing animation: `animate-pulse` on entire section

### Header Row
- Left: fire icon + "Revenge Opportunity" in `text-red-100 text-sm uppercase tracking-wider font-bold`
- Right: timer icon + countdown in `text-red-300 font-mono text-lg font-bold`
- Divider: `border-b border-white/10 pb-2`

### Description
- `text-xs text-gray-300` — "Take someone with you! Select a target before you die."

### Target Carousel
- `flex gap-3 overflow-x-auto pb-2`
- Each target: `w-12 h-12 rounded-full border border-gray-600 hover:border-red-500`
- Selected: `border-2 border-red-500 shadow-[0_0_10px_rgba(220,38,38,0.6)]` with check badge

---

## Props

| Prop | Type | Description |
|---|---|---|
| `timer` | number | Seconds remaining |
| `targets` | Player[] | Available targets |
| `selectedTarget` | Player \| null | Current selection |
| `onSelect` | function | Target selection handler |

---

## Screens Where Used

| Screen |
|---|
| Morning Resolution Screen (conditional — only when Boy is eliminated) |
