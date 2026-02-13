# Component: EliminationCard

> Card announcing a player's elimination during morning resolution.

---

## Visual Design

- Container: `glass-panel rounded-xl p-6 text-center`
- Top border accent: `border-t-4 border-t-red-500/70`
- Shadow: `shadow-2xl`
- Hover: `hover:scale-[1.02]`

### Content
- Avatar: `w-24 h-24 rounded-full border-4 border-red-500/30 grayscale`
- Death X: absolute centered `material-icons text-red-500 text-5xl font-bold drop-shadow-lg` — `close`
- Username: `text-2xl font-bold text-red-400`
- Divider: `h-px w-16 bg-red-500/30 mx-auto`
- Description: `text-gray-300 text-lg` — "was eliminated by the **Mafia**."

---

## Props

| Prop | Type | Description |
|---|---|---|
| `player` | Player | Eliminated player info |
| `eliminatedBy` | `"mafia"` \| `"vote"` \| `"revenge"` | How they were eliminated |

---

## Screens Where Used

| Screen |
|---|
| Morning Resolution Screen |
