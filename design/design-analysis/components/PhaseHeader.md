# Component: PhaseHeader

> Top section of game-phase screens showing phase name, description, and timer.

---

## Visual Design

- Container: header element, `shrink-0`, gradient background fading to transparent
- Background: `bg-gradient-to-b from-background-dark via-background-dark to-transparent`
- Padding: `pt-6 pb-4 px-6` or `pt-8 pb-4`
- Layout: flex column, centered content

### Structure

```
┌──────────────────────────────┐
│  [Phase Badge]               │  ← e.g., "Global Chat • Live Phase"
│                              │
│  Phase Title                 │  ← e.g., "Discussion Round 1"
│                              │
│  [Timer]                     │  ← TimerDisplay component
│                              │
│  Description text            │  ← e.g., "Discuss who is..."
└──────────────────────────────┘
```

---

## Variants

### 1. Discussion Phase
- Phase badge: `bg-surface-dark rounded-full` with green dot + "Live Phase"
- Title: `text-xl font-bold`
- Timer: Circular (centered below title)
- Description: `text-sm text-slate-400`

### 2. Public Voting Phase
- Title: `text-lg font-medium text-gray-400 uppercase tracking-widest` ("Public Execution")
- Timer: Inline large `text-5xl` with urgent animation
- Sub-text: "Tap a player to cast your suspicion"
- Progress bar below

### 3. Mafia Night Phase
- Badge: moon icon + "Night Phase" in red/primary
- Timer: inline `text-3xl`
- Title: "Choose a victim"
- Progress bar

### 4. Ability Phase (Sheikh)
- Left-aligned: phase label + role name with icon
- Timer: SVG ring, top-right
- Instruction: centered text + action pill badge

### 5. Ability Phase (Girl)
- Role badge: floating animated pill
- Left/right split: title left, timer right
- Progress bar full width

### 6. Boy Revenge
- Timer: centered SVG ring
- Title: "Last Revenge!" uppercase
- Description: centered below

---

## Props

| Prop | Type | Description |
|---|---|---|
| `phaseName` | string | Display name (e.g., "Discussion Round 1") |
| `phaseType` | enum | Phase identifier for variant selection |
| `description` | string | Helper text |
| `timer` | `{ seconds, totalSeconds }` | Timer data |
| `roundNumber` | number | Current round |
| `roleName` | string \| null | For ability phases |
| `roleIcon` | string \| null | Material icon for the role |

---

## Screens Where Used

| Screen | Variant |
|---|---|
| Discussion Phase | discussion |
| Public Voting | public-voting |
| Mafia Voting | mafia-night |
| Sheikh Ability | ability-left |
| Girl Protection | ability-split |
| Boy Revenge | centered-urgent |
