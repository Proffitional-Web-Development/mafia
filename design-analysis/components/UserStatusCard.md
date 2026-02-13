# Component: UserStatusCard

> Floating card overlay showing the current user's profile summary.

---

## Visual Design

- Container: `absolute -bottom-5 left-1/2 -translate-x-1/2 w-[90%]`
- Background: `bg-surface-dark/90 backdrop-blur-md border border-white/10 rounded-xl p-3`
- Shadow: `shadow-lg`
- Hover: `transform group-hover:-translate-y-1`
- Layout: `flex items-center justify-between`

### Left Side
- Avatar: `w-10 h-10 rounded-full border-2 border-primary` with online dot
- Label: `text-[10px] uppercase text-primary font-bold tracking-wider` — "Agent"
- Name: `text-sm font-bold text-white`

### Right Side
- Icon button: `h-8 w-8 rounded-lg bg-white/5 text-primary`
- Icon: `verified_user`

---

## Props

| Prop | Type | Description |
|---|---|---|
| `user` | User | Name, avatar, status |
| `isOnline` | boolean | Online indicator |

---

## Screens Where Used

| Screen |
|---|
| Mafia Game Home Screen |
