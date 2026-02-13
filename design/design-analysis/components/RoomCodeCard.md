# Component: RoomCodeCard

> Displays the room code for sharing, with a copy-to-clipboard button.

---

## Visual Design

- Container: `bg-surface-dark rounded-2xl p-6 text-center shadow-lg border border-white/5`
- Hover overlay: `absolute inset-0 bg-primary/5 group-hover:bg-primary/10`
- Label: `text-gray-400 text-sm font-medium uppercase tracking-widest` — "Room Code"
- Code: `text-4xl font-bold text-primary tracking-wider` (format: `X9J-2KL`)
- Copy button: `bg-primary/20 hover:bg-primary/30 p-2 rounded-lg text-primary`
  - Icon: `content_copy`
- Sub-text: `text-xs text-gray-500` — "Share this code with your friends"

---

## Props

| Prop | Type | Description |
|---|---|---|
| `code` | string | The room code (e.g., "X9J2KL") |
| `onCopy` | function | Copy handler |

---

## Screens Where Used

| Screen |
|---|
| Room Lobby Waiting Area |
