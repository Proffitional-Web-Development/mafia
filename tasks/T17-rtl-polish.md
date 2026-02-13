# T17 — RTL Layout Polish & Arabic UX

| Field | Value |
|-------|-------|
| **Agent** | A3 — i18n & RTL Specialist |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T05, T14 |

## Description

Polish all UI components for flawless Arabic RTL experience after core UI is built.

## Sub-Tasks

1. Audit all components for RTL correctness:
   - Margins, paddings using logical properties (`margin-inline-start` vs `margin-left`)
   - Icons that should mirror (arrows, navigation) vs. icons that shouldn't (play button)
   - Text alignment
2. Fix any Tailwind utility classes that use physical properties instead of logical
3. Ensure all animations respect direction (slide-in from correct side)
4. Test player grid/circle layout in RTL (ordering should mirror)
5. Verify form inputs (vote buttons, settings) work correctly in RTL
6. Arabic font optimization: load appropriate Arabic web font (e.g., Noto Sans Arabic)
7. Test number rendering (Arabic-Indic numerals vs. Western Arabic numerals — decide)
8. Verify timer display in RTL
9. Test all modals, tooltips, and dropdowns for RTL positioning
10. Screenshot comparison: every page in EN vs AR side-by-side

## Acceptance Criteria

- [ ] Every page looks polished in Arabic RTL
- [ ] No text overflow, misalignment, or reversed icons
- [ ] Animations direction-aware
- [ ] Arabic font renders beautifully
- [ ] Side-by-side screenshot review approved
