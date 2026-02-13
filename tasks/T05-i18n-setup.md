# T05 — Internationalization (i18n) Foundation

| Field | Value |
|-------|-------|
| **Agent** | A3 — i18n & RTL Specialist |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T01 |

## Description

Set up the bilingual infrastructure for Arabic (RTL) and English (LTR) from day one.

## Sub-Tasks

1. Install and configure `next-intl` or `react-i18next` with Next.js App Router
2. Create translation file structure: `locales/en.json`, `locales/ar.json`
3. Implement locale detection (browser preference) and manual language switcher
4. Configure Tailwind CSS for RTL support (`dir` attribute, logical properties)
5. Create `useDirection()` hook that returns `rtl` or `ltr` based on current locale
6. Set up translation keys for all game phases, roles, UI labels, and error messages
7. Ensure date/time formatting is locale-aware
8. Create a `<LocaleProvider>` wrapper component
9. Add locale to URL structure (`/en/lobby`, `/ar/lobby`) or cookie-based approach
10. Document translation contribution guide for adding new strings

## Acceptance Criteria

- [ ] Language switcher toggles between Arabic and English
- [ ] All static text uses translation keys (no hardcoded strings)
- [ ] RTL layout renders correctly for Arabic
- [ ] LTR layout renders correctly for English
- [ ] Page direction (`dir`) updates dynamically
- [ ] Font loads correctly for Arabic script
