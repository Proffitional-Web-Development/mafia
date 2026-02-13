# Component: BottomActionBar

> Fixed bottom bar containing the primary CTA and optional secondary action. Used on most game-phase screens.

---

## Visual Design

- Position: `fixed bottom-0 left-0 right-0`, z-20 to z-50
- Background: `bg-background-dark/95 backdrop-blur-md` or gradient `from-background-dark via-background-dark/95 to-transparent`
- Border: `border-t border-white/5` (optional)
- Padding: `p-4 pb-8` or `p-6 pb-8` (extra bottom for safe area)
- Rounded: `rounded-t-2xl` (some variants)

### Content Structure

```
┌──────────────────────────┐
│  [Warning/Info text]     │  ← Optional helper text
│                          │
│  ████████████████████    │  ← PrimaryButton (full width)
│                          │
│  [Secondary action]      │  ← Optional text button
└──────────────────────────┘
```

---

## Variants

### 1. Simple CTA
- Just a PrimaryButton
- Used: Role reveal, avatar selection, abilities

### 2. CTA + Secondary Text Button
- PrimaryButton ("Start Game") + danger text ("Leave Room")
- Used: Room lobby

### 3. CTA + Warning
- Info icon + private message + PrimaryButton
- Used: Mafia voting ("Keep this decision private…")

### 4. CTA + Owner Note
- PrimaryButton + `text-xs text-primary/60` explaining owner-only actions
- Used: Public voting, boy revenge

### 5. Progress Bar
- Progress bar with label instead of button
- Used: Morning resolution (loading next phase)

---

## Screens Where Used

All game-phase screens and most non-game screens.
