# Component: Badge

> Small informational tags used for labels, counts, and status indicators.

---

## Visual Variants

### 1. Vote Count Badge
- Container: `absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-surface-dark shadow-md`
- Background: `bg-primary` (normal), `bg-red-500` (high, with `animate-bounce`)
- Text: `text-white text-xs font-bold`

### 2. "YOU" Badge
- Pill: `bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-background-dark`
- Or: `absolute top-0 right-0 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg`
- Or: `absolute top-2 left-2 bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded uppercase font-bold`

### 3. Host/Owner Badge
- `absolute -top-1 -right-1 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full`
- With star icon

### 4. Phase Badge
- Pill: `inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background-dark/50 border border-white/10 backdrop-blur-sm`
- Dot: `w-2 h-2 rounded-full bg-primary animate-pulse`
- Text: `text-xs font-bold tracking-widest uppercase text-white/70`

### 5. Status Badge (Live)
- `px-3 py-1 bg-surface-dark rounded-full border border-primary/20`
- Green dot + "Live Phase"

### 6. Player Count Badge
- `text-primary font-medium bg-primary/10 px-3 py-1 rounded-full text-sm`
- E.g., "4/12 Joined"

### 7. Investigation Result Badge
- Innocent: `bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold px-2 py-0.5 rounded`
- Mafia: `bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold px-2 py-0.5 rounded`

### 8. Notification Dot
- `absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-slate-900`
- Contains count, e.g., "2"

---

## Screens Where Used

Badges appear across most game screens — voting, discussion, lobby, results, and abilities.
