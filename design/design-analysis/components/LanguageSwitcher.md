# Component: LanguageSwitcher

> Compact language toggle between English and Arabic.

---

## Visual Variants

### 1. Pill Toggle (Home Screen)
- Container: `bg-surface-dark/80 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full`
- Active: `text-primary` (e.g., "EN")
- Divider: `text-white/20` — "|"
- Inactive: `text-slate-400` (e.g., "AR")
- Text: `text-xs font-semibold tracking-wide`

### 2. Globe Button (Join/Create Lobby)
- Container: `px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md`
- Icon: `language` (Material) in `text-primary-light`
- Text: `text-xs font-medium text-white/80` — "EN / FR"

---

## Props

| Prop | Type | Description |
|---|---|---|
| `currentLocale` | `"en"` \| `"ar"` | Current language |
| `onToggle` | function | Switch handler |

---

## Screens Where Used

| Screen | Variant |
|---|---|
| Mafia Game Home Screen | pill-toggle |
| Join/Create Room Lobby | globe-button |
