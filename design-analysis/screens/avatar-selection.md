# Screen: Avatar Selection

> Onboarding step 2 — user picks or uploads a profile avatar.

---

## Screen Purpose

Second onboarding step. User can either upload a custom photo or select from a grid of preset icon avatars.

---

## Component Composition

| Component | Usage |
|---|---|
| `StepIndicator` | 3-step progress (step 2 active) |
| `AvatarCircle` | Large preview (w-40 h-40) with glow effect + edit badge |
| `SecondaryButton (outline)` | "Upload Photo" with camera icon |
| `PlayerGrid` | 4-col grid of preset icon buttons |
| `PrimaryButton` | "Complete Profile" with `arrow_forward` icon |

---

## Layout Notes

- **Top bar**: Back button (left) + "Skip for now" (right)
- **Progress**: `StepIndicator` centered below nav
- **Content**: Scrollable, centered
- **Avatar preview**: Large circle with gradient glow backdrop (`absolute -inset-1 blur`)
- **Upload button**: Full-width outline button below avatar
- **Preset grid**: 4x2 icon grid with "Quick Select" label + "View All" link
- **Bottom**: Fixed gradient fade, PrimaryButton inside

---

## Unique Requirements

- Photo upload with file picker / camera access
- Preset avatars use Material Icons (face_6, local_police, visibility, etc.)
- Selected preset shows: `border-2 border-primary` + small primary dot (top-right)
- Edit badge on avatar preview
- "Skip for now" option — avatar can be set later
- Preview updates in real-time when selecting preset or uploading

---

## Open Questions / Ambiguities

1. What image formats/sizes are accepted for upload?
2. Is there image cropping functionality?
3. "View All" — is there an expanded preset view or modal?
4. How are preset icons stored (Material Icon names, or actual images)?
5. Where are uploaded images stored (Convex file storage)?

---

## Dependencies

- `StepIndicator`, `AvatarCircle`, `PrimaryButton`, `SecondaryButton` components
- File upload handler (Convex storage)
- Preset avatar icon list
- Theme tokens (purple variant)
- i18n strings

---

## Implementation Checklist

- [ ] Build screen layout with top bar
- [ ] Reuse `StepIndicator` (step 2 of 3)
- [ ] Build large avatar preview with glow effect
- [ ] Build preset icon grid with selection state
- [ ] Implement file upload flow (input[type=file] → preview → upload)
- [ ] Reuse `PrimaryButton` and `SecondaryButton`
- [ ] Handle "Skip for now" navigation
- [ ] Wire up avatar save (Convex mutation for icon or uploaded URL)
- [ ] Add i18n for all text
