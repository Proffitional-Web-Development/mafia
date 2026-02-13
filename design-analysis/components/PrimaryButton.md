# Component: PrimaryButton

> Full-width call-to-action button used as the main action on every screen.

---

## Visual Variants

### 1. Default (Purple)
- Background: `bg-primary` (`#8311d4`)
- Text: white, `font-bold`, `text-lg` or default
- Shadow: `shadow-[0_4px_20px_rgba(131,17,212,0.4)]`
- Border radius: `rounded-xl`
- Padding: `py-4 px-6`
- Icon: trailing Material Icon with `group-hover:translate-x-1`

### 2. Danger / Mafia (Red)
- Background: `bg-primary` where primary = `#ec1313` / `#da0b0b`
- Shadow: `shadow-[0_0_20px_rgba(236,19,19,0.4)]`
- Used on mafia-voting, boy-revenge screens

### 3. With Shimmer Effect
- Overlay gradient that animates on hover (`translateX`)
- Used on home screen CTA, mafia voting confirm

---

## Props / States

| Prop | Type | Description |
|---|---|---|
| `label` | string | Button text (e.g., "Enter the Den", "Start Game") |
| `icon` | string (Material Icon name) | Trailing icon (e.g., `arrow_forward`, `login`, `gavel`, `search`) |
| `variant` | `"primary"` \| `"danger"` | Color variant |
| `disabled` | boolean | Disabled state (gray background, `cursor-not-allowed`) |
| `loading` | boolean | Loading state (spinner) |
| `fullWidth` | boolean | Always `true` in current designs |

### Interaction States

- **Default**: Full color background with glow shadow
- **Hover**: `hover:bg-primary/90` — slightly muted
- **Active/Pressed**: `active:scale-[0.98]` — scale down
- **Disabled**: `bg-surface-darker text-gray-500 cursor-not-allowed` (lobby waiting state)
- **Loading**: Not explicitly shown; inferred as needed

---

## Screens Where Used

| Screen | Label | Icon | Variant |
|---|---|---|---|
| Login | "Enter the Den" | `login` | primary |
| Username Selection | "Join the Family" | `arrow_forward` | primary |
| Avatar Selection | "Complete Profile" | `arrow_forward` | primary |
| Home Screen | "Go to Game" | `arrow_forward` | danger |
| Join/Create Lobby | (Create Room card — implicit) | `add` | primary |
| Room Lobby | "Start Game" | `play_arrow` | primary |
| Role Reveal | "I AM READY" | `arrow_forward` | primary |
| Discussion | "End Discussion Early" | `gavel` | secondary (outlined) |
| Public Voting | "Confirm Results" | `gavel` | primary |
| Mafia Voting | "Confirm Kill on [Name]" | `my_location` | danger |
| Sheikh Ability | "INVESTIGATE @Name" | `search` | primary |
| Boy Revenge | "USE REVENGE" | `gavel` | danger |
| Girl Protection | "Protect [Name]" | `local_hospital` | primary |
| Game Over | "Play Again" | `replay` | primary |
