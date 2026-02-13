# Phase 01 — Design System & Theming Alignment

> **Goal:** Replace the default Next.js/Tailwind scaffold styling with the Mafia Game design system. After this phase, every subsequent component and screen work builds on a stable, token-driven foundation.

---

## Current State (Web)

| Area | What Exists | Gap |
|---|---|---|
| Font | `Geist` + `Geist_Mono` + `Noto Sans Arabic` loaded via `next/font/google` | Design requires **Space Grotesk** (primary) + **Be Vietnam Pro** (home screen only). Geist is not used anywhere in the design. |
| Colors | Tailwind v4 defaults. Light/dark via `prefers-color-scheme`. CSS vars `--background: #ffffff / #0a0a0a`. | Design is **dark-only**. Needs custom purple palette (`#8311d4`), red/danger palette (`#ec1313`), custom surfaces (`#1a1022`, `#2d1b36`). No light mode. |
| Design tokens | `lib/design-tokens.ts` defines `FACTION_COLORS`, `ROLE_COLORS`, `PHASE_META`, `TYPOGRAPHY`, `SPACING`, `LAYOUT` as Tailwind class strings. | Tokens are functional but don't match the design's visual spec. Colors, spacing, and typography all diverge. File must be rewritten. |
| Icons | `lucide-react` installed but unused. All icons are emoji (🃏, 💀, 🔪, etc.) | Design uses **Material Icons** (Regular + Round) and **Material Symbols Outlined**. Emoji must be replaced. |
| Shadows/Glows | None defined. | Design relies heavily on glows (`shadow-[0_4px_20px_rgba(131,17,212,0.4)]`), ambient blur blobs, and shimmer effects. |
| Theme switching | None. Single color mode. | Design has two dark-mode sub-themes: **purple** (default) and **red** (mafia/home). Must be switchable via CSS custom properties or React context. |
| `globals.css` | Minimal. `@import "tailwindcss"`, basic body styles. | Needs custom `@theme` block, CSS custom properties, utility classes (`.no-scrollbar`, `.glow-primary`, `.animate-float`), decorative pattern classes, dark-mode lock. |

---

## Scope

### 1.1 — Install & Configure Fonts

**Files affected:** `app/layout.tsx`, `app/globals.css`

- Replace `Geist` / `Geist_Mono` imports with `Space_Grotesk` (weights 300–700) and `Be_Vietnam_Pro` (weights 400–900) from `next/font/google`.
- Keep `Noto_Sans_Arabic` for Arabic locale.
- Set CSS variables `--font-display`, `--font-display-alt`, `--font-arabic`.
- Update `body` font-family to `var(--font-display)`.
- Export font variable classnames onto `<body>`.

**Acceptance criteria:**
- All non-Arabic text renders in Space Grotesk.
- `font-display-alt` utility maps to Be Vietnam Pro.
- Arabic text still falls back to Noto Sans Arabic.

---

### 1.2 — Install Material Icons

**Files affected:** `app/layout.tsx` or `app/globals.css`, `package.json`

**Decision:** Use Google Fonts CDN `<link>` for Material Icons (Regular, Round, Symbols Outlined) in the `<head>`, OR install `@material-design-icons/font` package.

- Add the three Material Icon font families:
  - `Material Icons` (regular)
  - `Material Icons Round`
  - `Material Symbols Outlined`
- Create a reusable `<Icon>` component (`components/ui/icon.tsx`) that renders `<span className="material-icons">{name}</span>` with size/color/variant props.

**Acceptance criteria:**
- `<Icon name="fingerprint" />` renders the expected Material Icon glyph.
- All three font variants available and selectable via prop.

---

### 1.3 — Define CSS Custom Properties & Tailwind Theme

**Files affected:** `app/globals.css`

Rewrite `globals.css` to:

1. **Lock dark mode**: Remove `prefers-color-scheme` media query. Set `html { color-scheme: dark }`.
2. **Define CSS custom properties** on `:root` for the **purple (default)** theme:
   ```
   --color-primary: #8311d4
   --color-primary-dark: #620c9e
   --color-primary-light: #a345e8
   --color-danger: #ec1313
   --color-danger-dark: #da0b0b
   --color-bg: #1a1022
   --color-bg-red: #221010
   --color-surface: #2d1b36
   --color-surface-darker: #23152b
   --color-neutral-dark: #2d2438
   --color-surface-red: #2d1619
   --color-success: #22c55e
   --color-warning: #eab308
   --color-error: #ef4444
   --color-text-primary: #ffffff
   --color-text-secondary: #d1d5db
   --color-text-tertiary: #9ca3af
   --color-text-muted: #6b7280
   --color-text-disabled: #4b5563
   --color-text-accent: var(--color-primary)
   ```
3. **Define red/mafia theme** via `[data-theme="mafia"]` selector:
   ```
   --color-primary: #ec1313
   --color-primary-dark: #da0b0b
   --color-bg: #221010
   --color-surface: #2d1619
   ```
4. **Define Tailwind `@theme inline` block** mapping custom properties to Tailwind utilities:
   ```
   --color-primary: var(--color-primary)
   --color-background: var(--color-bg)
   --color-surface: var(--color-surface)
   --font-display: var(--font-space-grotesk)
   (etc.)
   ```
5. **Add utility classes:**
   - `.no-scrollbar` — hides scrollbar via `::-webkit-scrollbar` + `scrollbar-width: none`
   - `.glow-primary` — `box-shadow: 0 0 15px rgba(131,17,212,0.6)`
   - `.glow-primary-strong` — `box-shadow: 0 0 25px rgba(131,17,212,0.8)`
   - `.glow-danger` — `box-shadow: 0 0 20px rgba(236,19,19,0.4)`
   - `.text-glow` — `text-shadow: 0 0 20px rgba(131,17,212,0.6)`
   - `.gradient-text` — `bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-white`

6. **Add custom animations:**
   ```css
   @keyframes float { ... }           /* 3s ease-in-out translateY */
   @keyframes pulse-slow { ... }      /* 3-4s pulse cycle */
   @keyframes shimmer { ... }         /* translateX shine effect */
   @keyframes timer-pulse-ring { ... } /* scale + box-shadow */
   ```
   Map as `.animate-float`, `.animate-pulse-slow`, `.animate-shimmer`, `.animate-timer-ring`.

7. **Add decorative pattern classes:**
   - `.bg-scanlines` — repeating linear-gradient 4px
   - `.bg-dot-grid` — radial-gradient 40px repeat
   - `.bg-crosshair` — radial-gradient crosshair pattern

**Acceptance criteria:**
- `bg-primary`, `text-primary`, `bg-surface`, `bg-background` Tailwind utilities resolve to design tokens.
- Adding `data-theme="mafia"` to any container switches its subtree to red palette.
- All utility classes (`no-scrollbar`, `glow-primary`, etc.) work.
- Custom animations are available via Tailwind class names.

---

### 1.4 — Rewrite `lib/design-tokens.ts`

**Files affected:** `lib/design-tokens.ts`, and every file that imports from it

Update the token file to align with the design spec while preserving the export shape (to avoid breaking downstream imports):

- **`FACTION_COLORS`**: Update to use new custom property-based classes (e.g., `bg-primary/30` instead of hard-coded `bg-red-900/30`, `bg-blue-900/30`). Keep colorblind-safe hue differentiation.
- **`ROLE_COLORS`**: Map to design icon + color combos per role (purple for girl, emerald for sheikh, amber for boy, red for mafia, blue for citizen).
- **`PHASE_META`**: Replace emoji icons with Material Icon names (e.g., `"🃏"` → `"style"`, `"💬"` → `"chat"`, `"🗳️"` → `"how_to_vote"`).
- **`TYPOGRAPHY`**: Update to match design type scale (e.g., `hero: "text-3xl font-bold tracking-tight"`, `label: "text-xs font-bold uppercase tracking-widest"`).
- **`SPACING`**: Update `page` → `"px-6 py-6"`, `card` → `"p-4"`, etc.
- **`LAYOUT`**: Update `maxWidth` → `"max-w-sm"` (384px), `playerGrid` → configurable (2/3/4-col options).

**Acceptance criteria:**
- No TypeScript errors after update.
- All existing imports of design tokens continue to resolve.
- Token values match `design-analysis/theme.md` specifications.

---

### 1.5 — Create Theme Context (React)

**Files affected:** New file `components/theme-provider.tsx`, update `app/[locale]/layout.tsx`

- Create a `ThemeProvider` React context that exposes:
  - `theme: "default" | "mafia"` — current theme
  - `setTheme(theme)` — switches `data-theme` attribute on nearest container
- Wrap locale layout children with `<ThemeProvider>`.
- Game phase components will call `setTheme("mafia")` when entering mafia voting / boy revenge screens, and `setTheme("default")` otherwise.
- Home screen applies theme at page level.

**Acceptance criteria:**
- `useTheme()` hook available throughout the app.
- Setting theme to `"mafia"` swaps CSS custom properties to red palette.
- Theme resets to `"default"` when navigating away.

---

### 1.6 — Update Root Layout Metadata

**Files affected:** `app/layout.tsx`

- Change `title` from `"Create Next App"` to `"Mafia Game"`.
- Update `description` to something relevant.
- Set `<html>` class to `"dark"` to lock dark mode.
- Remove `dir="ltr"` hard-coding (LocaleProvider already handles this).

**Acceptance criteria:**
- Browser tab shows "Mafia Game".
- `<html>` element has `class="dark"`.

---

## Dependencies

- None (this is Phase 1).

## Parallelizable Tasks

| Task | Can parallelize with |
|---|---|
| 1.1 Fonts | 1.2 Icons |
| 1.3 CSS + Tailwind | 1.4 Design tokens (after 1.3 CSS vars defined) |
| 1.5 Theme context | Independent |
| 1.6 Metadata | Independent |

Tasks 1.1 + 1.2 + 1.5 + 1.6 can all run in parallel.
Tasks 1.3 → 1.4 are sequential (tokens depend on CSS variable names).

## Risks & Ambiguities

| Risk | Mitigation |
|---|---|
| Tailwind v4 `@theme inline` syntax may differ from v3 `theme.extend` | Verify against Tailwind v4 docs; the project already uses v4 (`@import "tailwindcss"`) |
| Material Icons CDN affects initial load time | Consider self-hosting subset or using `@material-design-icons/font` package |
| Removing light mode may break any existing user preference | Current app has no light-mode content — safe to remove |
| `design-tokens.ts` rewrite may break game components that reference old token values | Run `typecheck` after edit to catch all breakages; fix in same task |
| Be Vietnam Pro used only on home screen — worth the extra font load? | Flag for product decision; implementation should support it regardless |

## Files Changed (Summary)

| File | Action |
|---|---|
| `app/layout.tsx` | Edit (fonts, metadata, dark class) |
| `app/globals.css` | Rewrite (custom properties, theme, utilities, animations, patterns) |
| `lib/design-tokens.ts` | Rewrite (align with design spec) |
| `components/theme-provider.tsx` | New |
| `components/ui/icon.tsx` | New |
| `app/[locale]/layout.tsx` | Edit (add ThemeProvider wrapper) |
| `package.json` | Possibly edit (Material Icons package) |
