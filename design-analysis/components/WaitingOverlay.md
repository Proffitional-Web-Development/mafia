# Component: WaitingOverlay

> Full-screen overlay shown to non-active players during night ability phases.

---

## Visual Design

- Container: `absolute inset-0 z-50 bg-background-dark/95 flex flex-col items-center justify-center p-8 text-center`
- Moon emoji: `text-6xl animate-pulse-slow` with ambient glow (`bg-primary/20 blur-[40px]`)
- Title: `text-2xl font-bold text-white` — "The night is quiet..."
- Description: `text-gray-400`
- Loading dots: three `w-2 h-2 bg-primary rounded-full animate-bounce` with staggered delays

---

## Props

| Prop | Type | Description |
|---|---|---|
| `message` | string | Main message text |
| `subMessage` | string | Secondary description |

---

## Screens Where Used

| Screen |
|---|
| Sheikh Night Ability Phase (for non-sheikh players) |
| All ability phases (implied for non-active roles) |
