# Phase 05 — Polish, Consistency Checks & Cleanup

> **Goal:** Final pass to ensure visual consistency across all screens, i18n completeness, accessibility compliance, RTL parity, dead code removal, and production readiness.

> **Depends on:** Phases 01–04 complete.

---

## 5.1 — Visual Consistency Audit

**Scope:** Every screen side-by-side against its reference design HTML.

### Audit Checklist

For each of the 15 screens, verify:

| Check | Detail |
|---|---|
| Color accuracy | Background, surface, text, accent colors match theme tokens |
| Typography | Font family, weight, size, tracking, line-height all match type scale |
| Spacing | Page padding (`px-6`), inter-section gaps, card padding match spec |
| Border & radius | Correct `rounded-*` values, border colors, border widths |
| Shadow & glow | Glow effects on buttons, selected cards, avatar rings present |
| Icon rendering | Material Icons render at correct size, weight, and variant |
| Decorative elements | Blur blobs, scanlines, dot grids, crosshair patterns present |
| Component variants | Correct variant rendered in each context (e.g., `PlayerCard (voting)` not `PlayerCard (default)`) |

**Output:** Discrepancy list with file + line references. Each discrepancy should be a simple Tailwind class fix.

**Acceptance criteria:**
- [ ] Zero visual discrepancies remaining (or all flagged as intentional deviations)

---

## 5.2 — RTL Parity Verification

**Scope:** Full app walkthrough in Arabic locale.

### RTL Checklist

| Check | Detail |
|---|---|
| Layout direction | All flex/grid layouts respect `dir="rtl"` |
| Text alignment | Body text aligns to start (right in RTL) |
| Logical properties | All spacing uses `ms-`/`me-`/`ps-`/`pe-` instead of `ml-`/`mr-`/`pl-`/`pr-` |
| Icons | Directional icons (arrows, chevrons) flip in RTL |
| Inputs | Email/password inputs stay `direction: ltr` (existing CSS rule) |
| Bottom nav | Tab order mirrors for RTL |
| Progress bars | Fill direction flips |
| Player grid | Card order follows reading direction |
| Language switcher | Pill toggle positions flip |
| Decorative blobs | Positions mirror (or acceptable asymmetric) |

**How to test:** Set locale to `ar` and navigate every screen.

**Files potentially affected:** Any component using `left-*`, `right-*`, `ml-*`, `mr-*`, `pl-*`, `pr-*`, `text-left`, `text-right`, `rounded-l-*`, `rounded-r-*`.

**Fix pattern:** Replace physical properties with logical equivalents:
- `ml-*` → `ms-*`
- `mr-*` → `me-*`
- `left-*` → `start-*`
- `right-*` → `end-*`
- `text-left` → `text-start`
- `rounded-l-*` → `rounded-s-*`

**Acceptance criteria:**
- [ ] All screens render correctly in Arabic locale
- [ ] No visual breakage when switching EN ↔ AR
- [ ] Arabic text in `Noto Sans Arabic` renders with correct line height

---

## 5.3 — i18n Completeness

**Scope:** All hardcoded English strings replaced with `useTranslations()` calls.

### Action Items

1. **Scan for hardcoded strings:** Search all `.tsx` files for quoted English text not wrapped in `t()`.
   ```
   grep -rn '"[A-Z]' components/ app/ --include="*.tsx" | grep -v import | grep -v className
   ```
2. **Add missing translation keys** to both `locales/en.json` and `locales/ar.json`.
3. **Verify key parity:** Every key in `en.json` must exist in `ar.json` and vice versa.

### New Keys Likely Needed (from design analysis)

| Namespace | Keys to add |
|---|---|
| `auth` | `enterTheDen`, `codename`, `forgotKey`, `codeOfOmerta`, `notInFamily` |
| `onboarding` | `identifyYourself`, `joinTheFamily`, `availableAliases`, `skipForNow`, `completeProfile`, `uploadPhoto`, `quickSelect`, `viewAll`, `step` |
| `home` | `trustNoOne`, `goToGame`, `onlinePlayers`, `mafiaGame` |
| `room` | `mafiaNight`, `startPlaying`, `orJoin`, `participants`, `joined`, `waitingForMinPlayers`, `startGameCTA`, `leaveRoomCTA` |
| `roleReveal` | `cardDistribution`, `tapToReveal`, `iAmReady`, `identitySecret` |
| `discussion` | `discussionRound`, `livePhase`, `globalChat`, `endDiscussionEarly` |
| `voting` | `publicExecution`, `tapToVote`, `noVotes`, `targetLocked`, `confirmResults` |
| `mafiaVoting` | `nightPhase`, `chooseVictim`, `confirmKillOn`, `keepPrivate`, `theNightIsQuiet` |
| `ability` | `investigate`, `investigationLog`, `innocent`, `nightPhaseN` |
| `resolution` | `morningHasBroken`, `wasEliminatedBy`, `lastRevenge`, `useRevenge`, `irreversibleAction`, `preparingNextPhase`, `noOneEliminated` |
| `gameOver` | `winner`, `personalResult`, `victory`, `defeat`, `gameReport`, `playAgainCTA`, `leaveGameCTA` |

**Acceptance criteria:**
- [ ] Zero hardcoded English strings in component/page files
- [ ] `en.json` and `ar.json` have identical key structures
- [ ] App renders fully in Arabic with no missing key fallbacks

---

## 5.4 — Accessibility (a11y) Audit

### Checklist

| Check | Detail |
|---|---|
| **Keyboard navigation** | All interactive elements reachable via Tab. Focus order is logical. |
| **ARIA labels** | All icon-only buttons have `aria-label`. All images have `alt`. |
| **Role attributes** | Timers have `role="timer" aria-live="assertive"` (already on `PhaseTimer`). Status updates have `aria-live="polite"`. |
| **Color contrast** | Text contrast ≥ 4.5:1 on dark backgrounds. Badges contrast ≥ 3:1. |
| **Motion preference** | `@media (prefers-reduced-motion: reduce)` disables shimmer, float, pulse, bounce animations. |
| **Touch target size** | All interactive elements ≥ 44×44px (or have adequate spacing). |
| **Screen reader** | Phase transitions announced. Vote counts announced. Timer announcements at 30s, 10s, 0s. |
| **Skip links** | Consider skip-to-main-content link for keyboard users. |

### `prefers-reduced-motion` Implementation

Add to `globals.css`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Acceptance criteria:**
- [ ] All interactive elements keyboard-navigable
- [ ] No accessibility warnings from axe-core or Lighthouse audit
- [ ] Animations disabled for users with motion sensitivity preference

---

## 5.5 — Dead Code & Dependency Cleanup

### Code Cleanup

| Action | Files |
|---|---|
| Delete deprecated components | `button.tsx`, `role-card.tsx`, `phase-timer.tsx`, `player-avatar.tsx`, `vote-button.tsx`, `status-banner.tsx` (if replaced), `phase-transition.tsx` (if replaced) |
| Remove unused imports | Run `biome check .` to detect |
| Remove `lucide-react` | If fully replaced by Material Icons, remove from `package.json` |
| Update root layout metadata | Title: "Mafia Game", description updated (already in Phase 1 but verify) |
| Clean up `design-tokens.ts` | Remove any tokens that were replaced by CSS custom properties |

### Verify No Regressions

```bash
npm run typecheck     # TypeScript strict mode
npm run lint          # ESLint + Prettier
npm run check         # Biome
```

**Acceptance criteria:**
- [ ] Zero TypeScript errors
- [ ] Zero lint errors
- [ ] No unused imports or dead exports
- [ ] `package.json` has no unused dependencies

---

## 5.6 — Cross-Browser Testing

### Target Browsers

| Browser | Version | Priority |
|---|---|---|
| Chrome (Android) | Latest | P0 |
| Safari (iOS) | Latest + iOS 16 | P0 |
| Firefox (Android) | Latest | P1 |
| Chrome (Desktop) | Latest | P1 |
| Safari (Desktop) | Latest | P2 |

### Browser-Specific Issues to Watch

| Issue | Browser | Mitigation |
|---|---|---|
| `backface-visibility` needs prefix | Safari | Use `-webkit-backface-visibility: hidden` alongside unprefixed |
| `dvh` units not supported | Older iOS Safari | Fallback: `h-screen` with JS correction |
| `backdrop-filter: blur()` performance | Firefox | May need reduced blur values or fallback background |
| CSS `perspective` rendering | Safari | Test 3D card flip; may need `-webkit-perspective` |
| `env(safe-area-inset-*)` | Safari only | Progressive enhancement — non-Safari ignores gracefully |

**Acceptance criteria:**
- [ ] All screens render correctly on Chrome Android + Safari iOS
- [ ] 3D card flip works on Safari
- [ ] No layout shifts or overflows on any target browser

---

## 5.7 — Performance Baseline

### Metrics to Track

| Metric | Target |
|---|---|
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Total Bundle Size (JS) | Track, no hard limit |
| Font load time | < 500ms (Space Grotesk + Material Icons) |

### Optimization Actions

| Action | Detail |
|---|---|
| Font `display: swap` | Ensure `next/font/google` uses `display: "swap"` (default) |
| Image optimization | Hero image on home screen: use `next/image` with responsive sizes |
| Material Icons subsetting | If using CDN, consider `text` parameter to load only needed icons. If package, tree-shaking may not apply to icon fonts. |
| Animation GPU compositing | Ensure all animated properties are `transform` or `opacity` (not `width`, `height`, `top`, `left`) |
| Reduce ambient blob count | If FPS drops below 60, reduce blur radius or remove on low-end |

**Acceptance criteria:**
- [ ] Lighthouse mobile score ≥ 80 for Performance
- [ ] No layout shifts after initial load
- [ ] Fonts render within 500ms (no prolonged FOIT)

---

## 5.8 — Translation Quality Review

**Scope:** Arabic translation accuracy and cultural appropriateness.

- All new keys added in 5.3 need Arabic translations reviewed by a native speaker
- Game terminology should be consistent (e.g., "Mafia" transliteration vs. Arabic equivalent)
- RTL text wrapping for long strings verified
- Numeric formatting: Arabic numerals vs. Western numerals (product decision)

**Acceptance criteria:**
- [ ] Arabic translations reviewed and approved
- [ ] No mixed-direction text issues

---

## Parallelizable Tasks

| Task | Can parallelize with |
|---|---|
| 5.1 Visual audit | 5.2 RTL audit, 5.4 a11y audit |
| 5.3 i18n completeness | 5.5 Dead code cleanup |
| 5.6 Cross-browser testing | After 5.1–5.5 fixes applied |
| 5.7 Performance baseline | After 5.6 |
| 5.8 Translation review | Independent (can run anytime after 5.3) |

**Recommended flow:**
1. 5.1 + 5.2 + 5.3 + 5.4 + 5.5 in parallel (audit & cleanup)
2. Apply all fixes from step 1
3. 5.6 cross-browser testing
4. 5.7 performance measurement
5. 5.8 translation review (can overlap with 5.6/5.7)

---

## Risks & Ambiguities

| Risk | Mitigation |
|---|---|
| Visual audit finds many discrepancies, causing large rework | Prioritize: layout > color > spacing > decorative effects. Accept minor decorative differences. |
| Arabic translations may not be available immediately | Use placeholder Arabic text marked with `[TODO]` prefix; machine-translate as stopgap |
| Cross-browser testing requires physical devices | Use BrowserStack or similar cloud testing for iOS Safari |
| Performance optimizations may conflict with visual fidelity (blur effects, animations) | Use `@media (prefers-reduced-motion)` and detect GPU capability if needed |
| `prefers-reduced-motion` blanket rule may disable important functional animations (e.g., card flip) | Keep functional animations (card flip, phase transition) but reduce decorative ones (float, shimmer, pulse) |

---

## Definition of Done (Entire Implementation)

When Phase 5 is complete, the following must all be true:

- [ ] All 15 screens visually match their `/design-analysis/screens/*.md` specifications
- [ ] All 25 reusable components implement their `/design-analysis/components/*.md` specifications
- [ ] Design system tokens in code match `/design-analysis/theme.md`
- [ ] Full game flow works end-to-end: signup → onboarding → create room → play game → game over → play again
- [ ] App works in both English and Arabic locales
- [ ] App works on Chrome Android and Safari iOS
- [ ] No TypeScript errors, no lint errors, no dead code
- [ ] Accessibility: keyboard navigable, proper ARIA, motion preferences respected
- [ ] Lighthouse mobile performance score ≥ 80
