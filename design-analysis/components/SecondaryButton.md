# Component: SecondaryButton

> Lower-emphasis actions: outline buttons, text buttons, and ghost buttons.

---

## Visual Variants

### 1. Outline / Ghost Button
- Background: `bg-white/5` or `bg-transparent`
- Border: `border border-white/10` or `border border-primary`
- Text: `text-white` or `text-primary`
- Hover: `hover:bg-primary hover:text-white` (join game) or `hover:bg-white/5`
- Radius: `rounded-xl`
- Padding: `py-3.5 px-6` or `py-4 px-6`

### 2. Google OAuth Button
- Background: `bg-white/5`
- Border: `border border-white/10`
- Google logo positioned `absolute left-4`
- Text: `font-medium text-white`

### 3. Danger Text Button
- No background, no border
- Text: `text-red-400/80 hover:text-red-400`
- Usage: "Leave Room", "Leave Game"

### 4. Skip Vote / Dashed Button
- Border: `border-2 border-dashed border-gray-600`
- Text: `text-gray-400 font-bold uppercase tracking-wider`
- Hover: `hover:bg-white/5 hover:text-white hover:border-gray-400`

### 5. Text Link Button
- Inline text button: `text-primary font-bold hover:underline`
- Usage: "Create Account", "Forgot key?", "Skip for now"

---

## Props / States

| Prop | Type | Description |
|---|---|---|
| `label` | string | Button text |
| `icon` | string \| null | Optional icon |
| `variant` | `"outline"` \| `"ghost"` \| `"danger-text"` \| `"dashed"` \| `"oauth"` | Visual variant |
| `iconPosition` | `"left"` \| `"right"` | Icon placement |
| `disabled` | boolean | Disabled state |

---

## Screens Where Used

| Screen | Label | Variant |
|---|---|---|
| Login | "Continue with Google" | oauth |
| Login | "Create Account" | text-link |
| Login | "Forgot key?" | text-link |
| Avatar Selection | "Skip for now" | text-link |
| Avatar Selection | "Upload Photo" | outline |
| Join/Create Lobby | "Join Game" | outline → fills on hover |
| Room Lobby | "Leave Room" | danger-text |
| Discussion | "End Discussion Early" | outline w/ primary border |
| Public Voting | "Skip Vote" | dashed |
| Game Over | "Leave Game" | ghost |
