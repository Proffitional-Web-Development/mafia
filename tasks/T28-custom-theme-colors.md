# T28 — Custom Theme Color Picker

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P2 |
| **Complexity** | L |
| **Dependencies** | T02, T14, T23 |

## Description

Allow users to customize the website's theme colors beyond the existing default (purple) and mafia (red) themes. Users pick a primary accent color from a color picker in the settings page, and the entire UI adapts — backgrounds, surfaces, buttons, glows, and accents — by deriving a full palette from that single chosen color. The preference persists across sessions via the user's database record.

---

## Issue 1 — Color Palette Generation from a Single Accent Color

**Problem:** The current theme system uses hardcoded CSS custom properties (e.g. `--app-primary: #8311d4`, `--app-surface: #2d1b36`). All surface, background, and accent colors are manually tuned to the default purple. There is no mechanism to derive a coherent dark-mode palette from an arbitrary user-chosen color.

**Requirement:** Given a single user-chosen accent color (hex), generate a full set of CSS custom properties that maintain the app's dark aesthetic, proper contrast ratios, and visual coherence.

### Frontend Sub-Tasks

1. Create a `generateThemePalette(accentHex: string)` utility in `lib/theme-palette.ts`:
   - Input: a hex color string (e.g. `"#e91e63"`)
   - Output: an object mapping all `--app-*` CSS variable names to derived hex values
   - Derivation rules (using HSL manipulation):
     - `--app-primary` → the user's chosen color
     - `--app-primary-dark` → same hue, reduced lightness by ~15%
     - `--app-primary-light` → same hue, increased lightness by ~15%
     - `--app-bg` → same hue, saturation ~20%, lightness ~8% (very dark tinted background)
     - `--app-surface` → same hue, saturation ~25%, lightness ~14% (card/panel surface)
     - `--app-surface-darker` → same hue, saturation ~22%, lightness ~10%
     - `--app-neutral-dark` → same hue, saturation ~15%, lightness ~16%
     - `--app-text-accent` → same as `--app-primary`
   - Leave non-accent colors untouched (they remain global):
     - `--app-danger`, `--app-danger-dark` → keep `#ec1313` / `#da0b0b`
     - `--app-success` → keep `#22c55e`
     - `--app-warning` → keep `#eab308`
     - `--app-error` → keep `#ef4444`
     - `--app-text-primary` → keep `#ffffff`
     - `--app-text-secondary`, `--app-text-tertiary`, `--app-text-muted`, `--app-text-disabled` → keep current grays
   - Validate contrast ratios: ensure `--app-primary` against `--app-bg` meets WCAG AA (4.5:1 for text, 3:1 for large text/UI)
   - If the chosen color is too dark or too light for a dark theme, clamp lightness to a safe range (e.g. lightness between 40%–70% for the primary color)

2. Add HSL conversion helpers to the same utility file:
   - `hexToHsl(hex: string): { h: number; s: number; l: number }`
   - `hslToHex(h: number, s: number, l: number): string`
   - Keep these pure functions with no dependencies (no need for an external color library)

---

## Issue 2 — Preset Themes + Custom Color Picker

**Problem:** A raw color picker alone can lead to poor choices (e.g. neon yellow on dark backgrounds). Users need both curated presets and the freedom to pick a custom color.

**Requirement:** Offer a set of preset theme colors (including the current default purple) and a custom color picker for advanced users.

### Frontend Sub-Tasks

3. Define a `THEME_PRESETS` constant in `lib/theme-palette.ts`:
   ```ts
   export const THEME_PRESETS = [
     { key: "purple",  label: "Royal Purple",  hex: "#8311d4" }, // current default
     { key: "red",     label: "Crimson",        hex: "#ec1313" },
     { key: "blue",    label: "Ocean Blue",     hex: "#2563eb" },
     { key: "green",   label: "Emerald",        hex: "#059669" },
     { key: "orange",  label: "Sunset",         hex: "#ea580c" },
     { key: "pink",    label: "Rose",            hex: "#e91e63" },
     { key: "cyan",    label: "Teal",            hex: "#0891b2" },
     { key: "gold",    label: "Gold",            hex: "#ca8a04" },
   ] as const;
   ```
   - Each preset must produce a valid, tested palette via `generateThemePalette`

4. Create a `ThemeColorPicker` component in `components/settings/theme-color-picker.tsx`:
   - **Preset grid:** Show circular color swatches for each preset, with a check mark on the active one
   - **Custom option:** A final swatch labeled "Custom" that opens an HTML `<input type="color">` color picker
   - On preset tap: immediately apply the theme and save the preference
   - On custom color pick: apply the theme live as the user drags the picker (debounced), save on close/blur
   - Show a live preview strip below the picker: a row of small boxes showing the generated `bg`, `surface`, `primary`, `primary-dark` colors so the user sees the full palette before confirming

---

## Issue 3 — Theme Application via CSS Variables

**Problem:** The current `ThemeProvider` only toggles between `"default"` and `"mafia"` via a `data-theme` attribute. It has no mechanism to apply an arbitrary set of CSS custom properties at runtime.

**Requirement:** Extend the `ThemeProvider` to apply a user-chosen color palette by setting CSS custom properties on the root element dynamically.

### Frontend Sub-Tasks

5. Extend the `ThemeProvider` in `components/theme-provider.tsx`:
   - Add state for the user's custom accent color: `accentColor: string | null`
   - On mount, read the user's `themeColor` from the `getCurrentUser` query
   - When `accentColor` is set (not `null`):
     - Call `generateThemePalette(accentColor)` to get the CSS variable map
     - Apply each variable to `document.documentElement.style.setProperty(name, value)`
   - When `accentColor` is `null` (default):
     - Remove any overridden properties so the CSS `:root` defaults take effect: `document.documentElement.style.removeProperty(name)`
   - Keep the existing `"mafia"` theme override working:
     - The `data-theme="mafia"` attribute still applies during mafia-role views
     - User's custom color is the base; mafia theme overrides it temporarily when active
   - Expose `setAccentColor(hex: string | null)` via the theme context so settings and other components can trigger changes

6. Handle the initial flash (theme application before hydration):
   - On first load, the default CSS `:root` colors render
   - Once the Convex query resolves with the user's `themeColor`, apply the palette
   - This brief flash is acceptable for a v1 — a future optimization could inject the color via a cookie or `<script>` tag in the `<head>`

---

## Issue 4 — Persist Theme Preference Server-Side

**Problem:** The current theme state is local to the React session and resets on page reload. The user's chosen color must persist across sessions and devices.

**Requirement:** Store the user's chosen theme color in the database and load it on every session.

### Schema Changes

7. Add a `themeColor` field to the `users` table in `schema.ts`:
   - `themeColor: v.optional(v.string())` — stores the hex color string (e.g. `"#2563eb"`)
   - When `undefined` or `null`, the default purple theme is used

### Backend Sub-Tasks

8. Create a `setThemeColor` mutation in `users.ts`:
   - Requires authenticated user
   - Accepts `themeColor: v.union(v.string(), v.null())`
   - If string: validate it is a valid 7-character hex color matching `/^#[0-9a-fA-F]{6}$/`
   - If `null`: clears the preference (reverts to default)
   - Updates the `themeColor` field on the user document

9. Expose `themeColor` in the `getCurrentUser` query response:
   - Include `themeColor: user.themeColor ?? null` in the returned object
   - The `ThemeProvider` reads this value on mount to apply the saved theme

---

## Issue 5 — Settings Page Integration

**Problem:** Users need an accessible place to pick their theme color, integrated with the existing settings page (T23).

**Requirement:** Add a "Theme" section to the settings page with the preset grid, custom color picker, and a reset-to-default option.

### Frontend Sub-Tasks

10. Add a "Theme" section to the settings preferences area (in `components/settings/settings-page-content.tsx` or equivalent):
    - Section title: "Theme Color"
    - Render the `ThemeColorPicker` component
    - Add a "Reset to Default" button that calls `setThemeColor(null)` and resets the provider
    - Show the current active color as a highlighted swatch

11. Add i18n keys for EN and AR:
    - `"settings.preferences.theme"` → "Theme Color" / "لون السمة"
    - `"settings.preferences.themePresets"` → "Presets" / "ألوان مُعدّة"
    - `"settings.preferences.themeCustom"` → "Custom" / "مخصص"
    - `"settings.preferences.themeReset"` → "Reset to Default" / "إعادة تعيين إلى الافتراضي"
    - `"settings.preferences.themePreview"` → "Preview" / "معاينة"
    - Preset labels:
      - `"theme.purple"` → "Royal Purple" / "أرجواني ملكي"
      - `"theme.red"` → "Crimson" / "قرمزي"
      - `"theme.blue"` → "Ocean Blue" / "أزرق محيطي"
      - `"theme.green"` → "Emerald" / "زمردي"
      - `"theme.orange"` → "Sunset" / "غروب"
      - `"theme.pink"` → "Rose" / "وردي"
      - `"theme.cyan"` → "Teal" / "فيروزي"
      - `"theme.gold"` → "Gold" / "ذهبي"

---

## Issue 6 — Glow Effects & Design Token Adaptation

**Problem:** The app uses hardcoded RGB values in CSS glow effects (`.glow-primary { box-shadow: 0 0 15px rgb(131 17 212 / 60%); }`) and in `design-tokens.ts` faction/role colors. These won't update when the user changes their accent color.

**Requirement:** Glow effects and design tokens must adapt to the user's chosen theme color.

### Frontend Sub-Tasks

12. Refactor glow CSS classes in `globals.css` to use CSS custom properties:
    - Replace hardcoded RGB in `.glow-primary`:
      ```css
      .glow-primary {
        box-shadow: 0 0 15px color-mix(in srgb, var(--app-primary) 60%, transparent);
      }
      ```
    - Apply the same pattern to `.glow-primary-strong` and any other primary-derived glows
    - Keep `.glow-danger` hardcoded (danger color doesn't change)

13. Update `design-tokens.ts` for citizen faction colors:
    - The `citizens.accent` value is currently hardcoded to `"#8311d4"`
    - Change citizen-related accent tokens to reference `"var(--app-primary)"` where used in inline styles
    - For Tailwind class-based tokens (e.g. `bg-primary/25`), no changes needed — they already reference CSS variables via Tailwind

---

## Acceptance Criteria

- [ ] `generateThemePalette` produces a coherent dark-theme palette from any valid hex color
- [ ] Lightness clamping prevents unusable themes (too dark/too light primary)
- [ ] 8 preset themes are available with tested, visually coherent palettes
- [ ] Custom color picker allows any color with a live preview strip
- [ ] Theme applies immediately via CSS custom property overrides on `document.documentElement`
- [ ] Theme preference is persisted in the `users.themeColor` database field
- [ ] Theme loads from the database on session start and applies after hydration
- [ ] Settings page includes a "Theme Color" section with presets, custom picker, and reset button
- [ ] Mafia theme override still works correctly on top of the custom base theme
- [ ] Glow effects adapt to the user's chosen primary color (no hardcoded RGB)
- [ ] WCAG AA contrast ratios maintained for all generated palettes
- [ ] All i18n keys added for EN and AR
- [ ] RTL layout renders correctly for the color picker and preview
- [ ] No regressions in existing theme switching (default ↔ mafia) or visual consistency
