# Component: RoleRevealCard

> Flip card showing role assignment during card distribution phase.

---

## Visual Design

### Card Container
- Perspective: `perspective: 1000px` on parent
- Card: `preserve-3d`, `aspect-[2/3]`, `max-h-[60vh]`
- Transition: `duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]`
- Shadow: `shadow-2xl shadow-primary/20 hover:shadow-primary/40`

### Back Face (Unrevealed)
- Background: `bg-background-dark border border-white/10`
- SVG cross pattern overlay (primary color, opacity 40%)
- Center emblem: `w-32 h-32 rounded-full border-2 border-primary/30 bg-background-dark/80`
  - Icon: `help_outline` material icon, `text-5xl text-primary`
  - Glow: `shadow-[0_0_30px_rgba(131,17,212,0.3)]`
- Decorative: dashed border inset-3, gradient overlay
- Instruction below: "Tap card to reveal role" with `animate-pulse`

### Front Face (Revealed)
- Background: `bg-background-dark border border-primary/50`
- Header (40% height): gradient with overlay image
  - Center: role icon in `w-24 h-24 rounded-full bg-background-dark border-4 border-primary`
- Content section:
  - Role name: `text-3xl font-bold text-white tracking-tight`
  - Team badge: `text-xs font-semibold uppercase tracking-widest text-primary`
  - Divider: gradient line
  - Description: `text-base text-gray-300 leading-relaxed`
  - Identity note: icon + "Identity is secret" for town roles
- Shine overlay: subtle gradient

### Post-Reveal Action
- Ready button fades in: `opacity-0 → opacity-1, translateY(4) → translateY(0)`
- Delay: 300ms after card flip

---

## Props

| Prop | Type | Description |
|---|---|---|
| `role` | Role object | Role name, team, description, icon |
| `isRevealed` | boolean | Card flip state |
| `onReady` | function | "I AM READY" click handler |
| `teammates` | Player[] \| null | Mafia teammate list (shown below for mafia roles) |

---

## Screens Where Used

| Screen |
|---|
| Role Reveal Card Phase |
