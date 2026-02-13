# Component: SettingsPanel

> Card containing game configuration sliders (discussion duration, max players) for the room owner.

---

## Visual Design

- Container: `bg-surface-dark rounded-xl p-5 border border-white/5`
- Header: icon (`tune`) + `text-sm uppercase font-bold tracking-widest text-gray-400` — "Game Rules"

### Slider Row
- Label/Value row: `flex justify-between mb-2`
  - Label: `text-sm font-medium text-gray-300`
  - Value: `text-sm font-bold text-primary`
- Input: `<input type="range">` full width
  - Track: `bg-[#4a3b55] h-1 rounded-full`
  - Thumb: `w-5 h-5 rounded-full bg-primary shadow-[0_0_10px_rgba(131,17,212,0.5)]`
- Range labels: `flex justify-between text-[10px] text-gray-600` — min/max values

### Settings Available
1. **Discussion Duration**: 30s–300s, step 10
2. **Max Players**: 4–20, step 1

---

## Props

| Prop | Type | Description |
|---|---|---|
| `discussionDuration` | number | Current value |
| `maxPlayers` | number | Current value |
| `isOwner` | boolean | Editable only for room owner |
| `onChange` | function | Setting change handler |

---

## Screens Where Used

| Screen |
|---|
| Room Lobby Waiting Area |
