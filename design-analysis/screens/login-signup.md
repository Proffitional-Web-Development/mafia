# Screen: Login / Signup

> Authentication screen for user login and account creation.

---

## Screen Purpose

Entry point to the app. Users authenticate via email/password or Google OAuth. Includes a toggle to switch between Login and Sign Up modes.

---

## Component Composition

| Component | Usage |
|---|---|
| `TextInput` | Codename (username) field with `@` prefix icon |
| `TextInput` | Password field with `vpn_key` icon + visibility toggle |
| `PrimaryButton` | "Enter the Den" CTA with `login` icon |
| `SecondaryButton (oauth)` | "Continue with Google" with Google logo |
| `SecondaryButton (text-link)` | "Create Account" toggle |
| `SecondaryButton (text-link)` | "Forgot key?" link |
| `Divider` | "OR" separator between form and OAuth |

---

## Layout Notes

- **Container**: Phone-frame `max-w-sm h-[812px]` with rounded-3xl border
- **Background**: Dark matter texture overlay (30% opacity), two primary-colored blur blobs
- **Header**: Centered fingerprint icon in `w-24 h-24` circle with pulse ring + title + subtitle
- **Scanline overlay**: Full-screen scanline CSS effect (z-20, pointer-events-none)
- **Scroll**: `overflow-y-auto` with hidden scrollbar
- **Bottom**: "Not part of the family?" + "Create Account" toggle at `mt-auto`

---

## Unique Requirements

- Password visibility toggle button (eye icon)
- "Forgot key?" link (destination TBD)
- Scanline noir aesthetic overlay
- Dark matter background texture
- Login ↔ Signup mode toggle (not shown as separate screen — same layout, different CTA text)
- Google OAuth button with external logo image

---

## Open Questions / Ambiguities

1. Is there a separate Sign Up form with additional fields, or same fields with mode toggle?
2. What validation messages are shown for invalid credentials?
3. Where does "Forgot key?" navigate to (password reset flow)?
4. Should the scanline effect be a global wrapper or screen-specific?

---

## Dependencies

- Theme tokens (primary purple variant)
- Auth system (Convex + Google OAuth via `@auth/convex`)
- i18n strings for all labels

---

## Implementation Checklist

- [ ] Create `LoginForm` component with mode toggle (login/signup)
- [ ] Reuse `TextInput` component (2 instances)
- [ ] Reuse `PrimaryButton` component
- [ ] Reuse `SecondaryButton` (oauth variant) for Google sign-in
- [ ] Reuse `Divider` component
- [ ] Implement background decorative layer (blur blobs + texture)
- [ ] Implement scanline overlay CSS
- [ ] Wire up Convex auth actions
- [ ] Wire up Google OAuth flow
- [ ] Add form validation (client-side)
- [ ] Add i18n for all text content
- [ ] Handle loading / error states
