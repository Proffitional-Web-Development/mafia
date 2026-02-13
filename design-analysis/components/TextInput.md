# Component: TextInput

> Themed form input with icon prefix, used for authentication and room code entry.

---

## Visual Variants

### 1. Standard Input (Login / Username)
- Background: `bg-background-dark`
- Border: `border-2 border-primary/30`
- Focus: `focus:border-primary focus:ring-1 focus:ring-primary focus:shadow-[0_0_20px_rgba(131,17,212,0.2)]`
- Radius: `rounded-xl`
- Padding: `pl-10 pr-4 py-4` (with left icon) or `pl-10 pr-16 py-4` (with right status)
- Text: `text-white placeholder-gray-600`
- Left icon: absolute positioned, `text-gray-500`

### 2. Room Code Input
- Same base styling
- `text-center text-2xl font-mono tracking-[0.5em]`
- `uppercase` via CSS/JS
- `maxlength="6"`
- Placeholder as guide: `"XJ29KP"`

---

## Props / States

| Prop | Type | Description |
|---|---|---|
| `label` | string | Field label (e.g., "CODENAME", "SECRET KEY") |
| `placeholder` | string | Placeholder text |
| `type` | `"text"` \| `"password"` \| `"code"` | Input type |
| `leftIcon` | string | Material icon name or character (e.g., `@`, `vpn_key`) |
| `rightAction` | ReactNode \| null | Toggle visibility button for password |
| `rightStatus` | ReactNode \| null | Character count (`10/24`) + check icon |
| `helperText` | string \| null | Info text below input |
| `error` | string \| null | Error message |
| `maxLength` | number | Character limit |

### States

- **Default**: `border-primary/30`
- **Focused**: `border-primary ring-1 ring-primary` with shadow glow
- **Valid**: Green check icon on the right
- **Error**: Red border (inferred, not explicitly shown)

---

## Screens Where Used

| Screen | Usage | Variant |
|---|---|---|
| Login | Codename input | standard w/ `@` icon |
| Login | Password input | standard w/ `vpn_key` icon + visibility toggle |
| Username Selection | Username input | standard w/ `@` icon + character count |
| Join/Create Lobby | Room code input | code variant |
