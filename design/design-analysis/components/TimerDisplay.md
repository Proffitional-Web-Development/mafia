# Component: TimerDisplay

> Countdown timer shown during timed game phases. Two primary formats: circular and inline.

---

## Visual Variants

### 1. Circular Timer (Discussion Phase)
- Container: `w-24 h-24 rounded-full bg-surface-darker border-2 border-primary`
- Shadow: `shadow-[0_0_30px_rgba(131,17,212,0.3)]`
- Pulse effect: `timer-pulse` keyframe animation (scale + box-shadow)
- Inner text: `text-2xl font-bold text-white` (time) + `text-[10px] text-primary/80` ("Remaining")
- Ambient glow: `absolute bg-primary/20 rounded-full blur-xl animate-pulse-slow`

### 2. SVG Ring Timer (Sheikh / Boy Revenge)
- Circular SVG with `stroke-dasharray` and `stroke-dashoffset`
- Container: `w-12 h-12` or `w-20 h-20 rounded-full border-4 border-primary/30`
- Time text: `text-sm font-bold` or `text-3xl font-bold text-primary`
- Color: `stroke="#8311d4"` or `stroke="currentColor"`

### 3. Inline Timer (Public Voting / Mafia Voting)
- Large text: `text-5xl font-bold tracking-tighter tabular-nums`
- Urgent animation: `pulse-red` keyframes alternating red/white
- Companion: `animate-pulse` Material icon `timer`
- Sub-label: "URGENT" text with `animate-pulse`

### 4. Progress Bar Timer
- Full-width: `w-full h-1.5 bg-surface-dark rounded-full`
- Fill: `bg-gradient-to-r from-primary to-purple-400` or `bg-primary`
- Glow on fill: `shadow-[0_0_10px_rgba(131,17,212,0.8)]`

### 5. Compact Timer (Girl Protection)
- Inline horizontal layout: time left label + `text-2xl font-mono font-bold`
- Below: narrow progress bar

---

## Props

| Prop | Type | Description |
|---|---|---|
| `seconds` | number | Remaining time in seconds |
| `totalSeconds` | number | Total phase duration (for progress calculation) |
| `variant` | `"circle"` \| `"ring"` \| `"inline"` \| `"bar"` \| `"compact"` | Display format |
| `urgent` | boolean | Red pulsing animation when time is low |
| `label` | string \| null | Sub-label text (e.g., "Remaining", "Time Left") |

---

## Screens Where Used

| Screen | Variant | Position |
|---|---|---|
| Discussion Phase | circle + bar | Header center |
| Public Voting | inline + bar | Header center |
| Mafia Voting | inline + bar | Header |
| Sheikh Ability | ring (SVG) | Header right |
| Boy Revenge | ring (SVG) | Header center |
| Girl Protection | compact + bar | Header right |
