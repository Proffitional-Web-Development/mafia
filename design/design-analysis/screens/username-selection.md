# Screen: Username Selection

> Onboarding step 1 — user picks a unique in-game handle.

---

## Screen Purpose

First step of post-auth onboarding. User enters a unique username (3-24 chars, letters/numbers/underscores). Suggested aliases offered as quick picks.

---

## Component Composition

| Component | Usage |
|---|---|
| `StepIndicator` | 3-step progress (step 1 active) |
| `TextInput` | Username input with `@` prefix, character counter, validation check |
| `SuggestedChips` | "Available Aliases" row |
| `PrimaryButton` | "Join the Family" with `arrow_forward` icon |

---

## Layout Notes

- **Header**: Back button (left) + `StepIndicator` (center) + spacer (right)
- **Icon**: Same fingerprint circle (w-24 h-24) with pulse ring
- **Title**: "Identify Yourself" + description paragraph
- **Form**: Vertically centered (`flex-1 flex-col justify-center`)
- **Bottom**: PrimaryButton at `mt-auto` + legal text ("Code of Omertà")
- **Background**: Same as login — dark matter texture + blur blobs + scanlines

---

## Unique Requirements

- Real-time username availability check (debounced)
- Character count display (`10/24`) with green check when valid
- Validation rules: 3-24 chars, letters/numbers/underscores only, no spaces
- Suggested name generation (server-side or static list)
- Tapping a suggestion fills the input

---

## Open Questions / Ambiguities

1. Are suggested aliases generated dynamically or pulled from a static list?
2. How is username uniqueness validated? Real-time API call?
3. What are the error states (already taken, invalid chars, too short)?
4. Back button destination: logout or login screen?

---

## Dependencies

- `StepIndicator`, `TextInput`, `SuggestedChips`, `PrimaryButton` components
- Username validation API endpoint
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build screen layout with back navigation
- [ ] Reuse `StepIndicator` (step 1 of 3)
- [ ] Reuse `TextInput` with character counter and validation icon
- [ ] Build `SuggestedChips` component
- [ ] Implement real-time username availability check
- [ ] Implement input validation (regex + length)
- [ ] Reuse `PrimaryButton` with disabled state until valid
- [ ] Add legal/terms text link
- [ ] Wire up to user profile creation (Convex mutation)
- [ ] Add i18n for all text
