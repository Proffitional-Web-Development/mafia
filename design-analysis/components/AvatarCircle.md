# Component: AvatarCircle

> Circular avatar image with optional status indicator, border, and badge overlays.

---

## Visual Variants

### 1. Default Avatar
- Size classes: `w-10 h-10`, `w-12 h-12`, `w-14 h-14`, `w-16 h-16`, `w-20 h-20`, `w-24 h-24`
- Shape: `rounded-full`
- Border: `border-2 border-white/20` (default) or `border-2 border-primary` (active)
- Overflow: `overflow-hidden`
- Image: `object-cover rounded-full`

### 2. With Online Indicator
- Dot: `absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[background]`

### 3. With Glow Ring
- Outer glow: `ring-2 ring-primary/30`
- Or gradient ring: `p-0.5` or `p-1` with border

### 4. Selected State
- Border: `border-2 border-primary` or `border-2 border-success-glow`
- Shadow glow matching border color

### 5. Dead State
- `grayscale blur-[2px]`
- X overlay: centered `material-icons text-red-500`

### 6. Initial Fallback
- When no image: centered initials text `text-5xl font-bold text-white/20`
- Or gradient background: `bg-gradient-to-br from-indigo-500 to-purple-600` with text

### 7. Edit Badge (Avatar Selection)
- `absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full`
- Icon: `edit`

### 8. Glow Effect Wrapper (Avatar Selection)
- `absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-full blur opacity-25`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `src` | string \| null | Image URL |
| `alt` | string | Alt text |
| `initials` | string | Fallback initials (e.g., "JD") |
| `size` | `"xs"` \| `"sm"` \| `"md"` \| `"lg"` \| `"xl"` \| `"2xl"` | Size variant |
| `online` | boolean | Show online indicator |
| `selected` | boolean | Active selection border |
| `dead` | boolean | Grayscale with X |
| `editable` | boolean | Show edit badge |
| `glowing` | boolean | Glow ring effect |
| `borderColor` | `"primary"` \| `"success"` \| `"danger"` \| `"default"` | Border semantic |

---

## Screens Where Used

Every screen that shows players, user profiles, or avatars.
