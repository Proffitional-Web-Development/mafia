# 🎨 Global Design System — Theme Specification

> Extracted from 15 screen designs. This document defines the canonical design tokens for the Mafia Game mobile-first UI.

---

## 1. Color System

### 1.1 Primary Palette

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#8311d4` | Default brand color — buttons, links, badges, active borders, focus rings |
| `primary-dark` | `#620c9e` | Hover/pressed state for primary buttons |
| `primary-light` | `#a345e8` / `#9c3ce6` | Lighter accent, gradient endpoints, subtle highlights |

### 1.2 Danger / Mafia Palette

| Token | Hex | Usage |
|---|---|---|
| `danger` | `#ec1313` | Mafia-themed actions, kill confirmations, urgent timers |
| `danger-dark` | `#da0b0b` | Boy revenge ability, intense danger states |
| `danger-home` | `#f20d33` | Home screen accent (used instead of purple on home) |

> **Context Rule:** The primary color shifts to **red** on screens where the user is acting as Mafia (mafia voting, boy revenge). The home screen also uses red as its primary. All other screens use **purple**.

### 1.3 Background Colors

| Token | Hex | Usage |
|---|---|---|
| `background-dark` | `#1a1022` | Default dark mode page background |
| `background-dark-red` | `#221010` / `#221013` | Background for mafia/red-themed screens |
| `background-light` | `#f7f6f8` / `#f8f5f6` | Light mode page background (unused in current dark-first design) |

### 1.4 Surface Colors

| Token | Hex | Usage |
|---|---|---|
| `surface-dark` | `#2d1b36` | Cards, panels, elevated containers |
| `surface-darker` | `#23152b` / `#24152b` | Deeper surfaces (bottom nav, nested cards) |
| `neutral-dark` | `#2d2438` / `#2d2038` | Neutral card backgrounds (ability phases) |
| `surface-dark-red` | `#2d1619` | Surface for red-themed screens (home) |

### 1.5 Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `success` | `#22c55e` (green-500) | Online indicators, alive status, protection shield, innocent result |
| `warning` | `#eab308` (yellow-500) | Host badge, YOU badge on morning screen |
| `error` | `#ef4444` (red-500) | Dead status, elimination, high vote count |
| `info` | `#8311d4` | Information, investigation log |

### 1.6 Text Colors

| Token | Usage |
|---|---|
| `text-primary` | `white` — headings, active content |
| `text-secondary` | `gray-300` / `slate-300` — body text |
| `text-tertiary` | `gray-400` / `slate-400` — descriptions, subtitles |
| `text-muted` | `gray-500` / `slate-500` — helper text, timestamps |
| `text-disabled` | `gray-600` — placeholder text, disabled states |
| `text-accent` | `primary` (#8311d4) — labels, links, active names |

---

## 2. Typography

### 2.1 Font Families

| Token | Font | Usage |
|---|---|---|
| `font-display` | `Space Grotesk` | Primary typeface for all screens (weights: 300–700) |
| `font-display-alt` | `Be Vietnam Pro` | Home screen only (weights: 400–900) — **NOTE:** Consider unifying to Space Grotesk |

### 2.2 Icon Fonts

- **Material Icons** (Regular) — most screens
- **Material Icons Round** — home, lobby, mafia voting, girl protection
- **Material Symbols Outlined** — supplementary icons

### 2.3 Type Scale

| Level | Class | Size | Weight | Tracking | Usage |
|---|---|---|---|---|---|
| Display | `text-5xl` | 3rem | `font-black` (900) | `tracking-tighter` | Home screen title |
| H1 | `text-3xl` | 1.875rem | `font-bold` (700) | `tracking-tight` | Screen titles |
| H2 | `text-2xl` | 1.5rem | `font-bold` (700) | `tracking-tight` | Section titles, card headings |
| H3 | `text-xl` / `text-lg` | 1.25rem / 1.125rem | `font-bold` / `font-semibold` | — | Sub-section titles |
| Body | `text-base` | 1rem | `font-medium` (500) | — | Descriptive paragraphs |
| Body Small | `text-sm` | 0.875rem | `font-medium` (500) | — | Card descriptions, instructions |
| Label | `text-xs` | 0.75rem | `font-bold` (700) | `tracking-widest` / `tracking-wider` | Phase labels, uppercase tags |
| Micro | `text-[10px]` | 10px | `font-bold` / `font-medium` | `tracking-wider` | Badges, role tags, sub-labels |

### 2.4 Special Text Styles

- **Uppercase labels**: `uppercase tracking-widest font-bold text-xs` — used for phase names, section headers
- **Gradient text**: `bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-white` — winner announcement
- **Glow text**: `text-shadow: 0 0 20px rgba(131,17,212,0.6)` — prominent headings
- **Timer mono**: `font-mono tabular-nums` — countdown timers
- **Strikethrough**: `line-through decoration-red-500/50` — dead player names

---

## 3. Spacing System

### 3.1 Page-Level

| Property | Value | Context |
|---|---|---|
| Page horizontal padding | `px-6` (24px) | Standard for all screens |
| Page top padding | `pt-6` to `pt-12` (24–48px) | Header area / safe-area-top |
| Page bottom padding | `pb-8` to `pb-32` (32–128px) | Accounts for fixed bottom bars |
| Content max width | `max-w-sm` (384px) or `max-w-md` (448px) | Mobile container |

### 3.2 Component-Level

| Property | Value | Context |
|---|---|---|
| Card padding | `p-3` to `p-6` | Small cards to large panels |
| Inter-section gap | `mb-6` to `mb-8` | Between major sections |
| Inner element gap | `gap-2` to `gap-4` | Grid/flex gaps |
| Form field spacing | `space-y-5` | Between form inputs |
| Button padding | `py-4 px-6` | Primary action buttons |
| Icon-text gap | `gap-2` | Inline icon + label |

### 3.3 Grid System

| Layout | Columns | Gap | Context |
|---|---|---|---|
| Player grid (game phase) | `grid-cols-2` | `gap-3` to `gap-4` | Discussion, voting, abilities |
| Player grid (lobby) | `grid-cols-4` | `gap-4` | Room lobby waiting area |
| Player grid (abilities) | `grid-cols-3` | `gap-3` | Sheikh investigation |
| Avatar preset grid | `grid-cols-4` | `gap-4` | Avatar selection |
| Survivor status grid | `grid-cols-4` | `gap-3` | Morning resolution |

---

## 4. Layout Patterns

### 4.1 Page Structure

All screens follow a mobile-first single-column layout:

```
┌─────────────────────────┐
│  Header / Status Bar    │  ← shrink-0, px-6
├─────────────────────────┤
│                         │
│  Main Content Area      │  ← flex-1, overflow-y-auto
│  (scrollable)           │
│                         │
├─────────────────────────┤
│  Fixed Bottom Action    │  ← fixed bottom-0, z-20+
└─────────────────────────┘
```

### 4.2 Container Constraints

- **Phone frame**: `max-w-sm h-[812px]` or `max-w-md h-[100dvh]`
- **Content overflow**: `overflow-y-auto` with hidden scrollbars (`.no-scrollbar`)
- **Safe areas**: `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`

### 4.3 Fixed Elements

- **Bottom Navigation**: Fixed, `bg-surface-darker/95 backdrop-blur-xl`, z-50
- **Bottom Action Bar**: Fixed, gradient fade `from-background-dark`, z-20–z-50
- **Floating buttons**: `absolute bottom-X right-6`, z-30

---

## 5. Border & Radius System

| Token | Value | Usage |
|---|---|---|
| `rounded-DEFAULT` | `0.25rem` | Small elements |
| `rounded-lg` | `0.5rem` | Tags, minor cards |
| `rounded-xl` | `0.75rem` | Buttons, cards, inputs |
| `rounded-2xl` | `1rem` | Large cards, panels |
| `rounded-3xl` | — | Phone frame container |
| `rounded-full` | `9999px` | Avatars, badges, pills |

### Border Styles

- **Active/Selected**: `border-2 border-primary` with shadow glow
- **Default card**: `border border-white/5` or `border border-white/10`
- **Hover**: `hover:border-white/10` or `hover:border-primary/50`
- **Empty slot**: `border-2 border-dashed border-gray-500`
- **Input focus**: `focus:border-primary focus:ring-1 focus:ring-primary`

---

## 6. Shadow & Glow System

| Name | Value | Usage |
|---|---|---|
| Primary button glow | `shadow-[0_4px_20px_rgba(131,17,212,0.4)]` | CTA buttons |
| Red button glow | `shadow-[0_0_20px_rgba(236,19,19,0.4)]` | Mafia action buttons |
| Card glow (selected) | `shadow-[0_0_15px_rgba(131,17,212,0.4)]` | Selected player cards |
| Input focus glow | `focus:shadow-[0_0_20px_rgba(131,17,212,0.2)]` | Text inputs |
| Ambient blur | `blur-[100px]` with `bg-primary/20` | Background atmospheric blobs |
| `shadow-glow` | `0 0 15px rgba(131,17,212,0.6)` | General glow utility |
| `shadow-glow-strong` | `0 0 25px rgba(131,17,212,0.8)` | Emphasized glow |

---

## 7. Animation & Transitions

| Name | Description | Usage |
|---|---|---|
| `active:scale-[0.98]` | Press feedback | All interactive buttons |
| `animate-pulse` | Standard CSS pulse | Online indicators, notifications |
| `animate-pulse-slow` | 3–4s pulse cycle | Background blobs, ambient effects |
| `animate-bounce` | Bounce effect | High-priority badges |
| `animate-float` | 3s ease-in-out translateY | Role badges |
| `transition-all` | General transition | Most interactive elements |
| `transition-colors` | Color-only transition | Hover states |
| `transition-transform` | Transform-only | Icon hover effects (translate, rotate) |
| Card flip | `rotateY(180deg)` with `preserve-3d` | Role reveal card |
| Group hover translate | `group-hover:translate-x-1` | Button arrow icons |
| Shimmer | `translateX` animation | Button shine effect |
| Timer pulse ring | Scale + box-shadow keyframes | Discussion timer |

---

## 8. Decorative Patterns

| Pattern | Implementation | Screens |
|---|---|---|
| **Scanlines** | CSS linear-gradient 4px repeating | Login, username selection |
| **Dark matter texture** | External transparent texture URL | Login, username selection |
| **Stardust** | External transparent texture URL | Girl protection |
| **Carbon fibre** | External transparent texture URL | Discussion (user card) |
| **Dot grid** | CSS radial-gradient 40px repeat | Role reveal |
| **Crosshair pattern** | CSS radial-gradient | Mafia voting |
| **Ambient blobs** | Absolute positioned div + blur-3xl | All screens |
| **Gradient overlays** | `bg-gradient-to-t from-background-dark` | Bottom fade on all screens |

---

## 9. Contextual Theme Switching

The design uses **two color modes** within dark mode:

| Context | Primary | Background | Surface | Screens |
|---|---|---|---|---|
| **Default (Town/Neutral)** | `#8311d4` (purple) | `#1a1022` | `#2d1b36` | Login, onboarding, lobby, discussion, voting, sheikh, girl, role reveal, morning, game over |
| **Mafia/Danger** | `#ec1313` / `#da0b0b` (red) | `#221010` | `#2d1619` | Home, mafia voting, boy revenge |

> **Implementation note**: Theme switching should be handled via CSS custom properties or a React context that swaps token sets based on the active game context.
