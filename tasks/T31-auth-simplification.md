# T31 — Authentication & Profile Rules Simplification

| Field | Value |
|-------|-------|
| **Agent** | A1 — Backend Architect |
| **Co-Agent** | A2 — Frontend UI Engineer |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T04, T23 |

## Description

Simplify the authentication and onboarding flow by removing password complexity requirements, merging sign-in and sign-up into a single seamless flow (auto sign-up), removing the forced onboarding page entirely, and restricting profile customization to the Settings page only. New users get sensible defaults (username as display name, initials-based avatar) and can start playing immediately.

---

## Issue 1 — Remove Password Complexity Rules

**Problem:** The auth page enforces a minimum 8-character password (`minLength={8}` on the password input in `web/app/[locale]/auth/page.tsx`). This adds unnecessary friction — there is no server-side password complexity validation in the `@convex-dev/auth` Password provider configuration.

**Requirement:** Accept any non-empty password during signup and login. Remove all client-side password length validation.

### Frontend Sub-Tasks

1. Remove the `minLength={8}` attribute from the password input in `web/app/[locale]/auth/page.tsx`:
   - Keep the `required` attribute (password cannot be empty)
   - Remove or update any helper text referencing "minimum 8 characters"

2. Update i18n keys in `messages/en.json` and `messages/ar.json`:
   - Remove or update `"auth.passwordMinLength"` or similar keys if they exist
   - Ensure no validation error messages reference password length

### Backend Sub-Tasks

3. Verify `web/convex/auth.ts` Password provider has no server-side password length validation:
   - The `@convex-dev/auth` Password provider accepts passwords through its internal hashing — confirm no custom `validatePassword` hook or length check exists
   - If any custom validation exists, remove it

---

## Issue 2 — Auto Sign-Up on Login Attempt

**Problem:** Users must explicitly toggle between "Sign In" and "Sign Up" modes on the auth page. The `mode` state switches between `"signIn"` and `"signUp"`, and each flow has different behavior: sign-in fails if the username doesn't exist, sign-up fails if the username already exists.

**Requirement:** Merge sign-in and sign-up into a single seamless flow. When a user enters a username and password:
- If the username exists → sign in with the provided credentials
- If the username doesn't exist → automatically create the account and sign in

### Backend Sub-Tasks

4. Modify the authentication flow in `web/convex/auth.ts` (or create a wrapper):
   - Option A: If `@convex-dev/auth` Password provider supports a `flow: "signInOrSignUp"` mode, use it
   - Option B: Create a custom auth action that:
     1. Attempts `signIn` with `flow: "signIn"`
     2. If it fails with a "user not found" error, retry with `flow: "signUp"` using the same credentials
   - Username validation rules (3-24 chars, alphanumeric + underscore) still apply during account creation
   - Return success in both cases (existing user login or new user creation)

5. Ensure the auto-signup path initializes user defaults (see Issue 3, sub-task 9) — the `profile()` function in the Password provider should set `displayName`, `stats`, etc. on new users

### Frontend Sub-Tasks

6. Simplify the auth page UI in `web/app/[locale]/auth/page.tsx`:
   - Remove the `mode` state variable and the "Sign In" / "Sign Up" toggle
   - Remove the "Need an account?" / "Already have an account?" toggle button
   - Use a single unified page title (e.g. "Welcome" or "Sign In")
   - Use a single submit button label (e.g. "Continue")
   - Always call the auth flow with the unified parameter (auto sign-in or sign-up)

7. Update the redirect logic after successful authentication:
   - Change redirect destination from `/onboarding` to `/game`
   - Remove any conditional logic that checks `hasCompletedProfile`

8. Update i18n keys for the simplified flow:
   - Add: `"auth.welcome"` → "Welcome" / "مرحباً"
   - Add: `"auth.continue"` → "Continue" / "متابعة"
   - Remove or deprecate: `"auth.needAccount"`, `"auth.haveAccount"`, `"auth.createAccount"`, `"auth.signUp"` if no longer used
   - Keep: `"auth.signIn"` as fallback label if needed

---

## Issue 3 — Remove Forced Onboarding Flow

**Problem:** After first login, users are redirected to `web/app/[locale]/onboarding/page.tsx` where they must complete a two-step process (set display name + upload avatar) before accessing the game. The `hasCompletedProfile` flag (computed as `Boolean(user.displayName)` in `getCurrentUser`) gates access to the game. This creates friction for users who want to start playing immediately.

**Requirement:** Remove the mandatory onboarding page entirely. Users access the game immediately after authentication. Profile customization (display name, avatar) is only available from the Settings page (T23).

### Backend Sub-Tasks

9. Update the `profile()` function in `web/convex/auth.ts` Password provider to set defaults for new users at signup:
   - Set `displayName` to `username` (the username they chose at signup)
   - Initialize `stats: { gamesPlayed: 0, wins: 0, losses: 0 }`
   - Set `musicEnabled: true`
   - Set `createdAt: Date.now()`
   - This ensures every new user has a complete profile immediately

10. Update the `getCurrentUser` query in `web/convex/users.ts`:
    - Always return `hasCompletedProfile: true` regardless of whether `displayName` is set
    - Alternatively: remove `hasCompletedProfile` from the return type entirely and update all consumers
    - Ensure `displayName` falls back to `username` if not explicitly set: `displayName: user.displayName ?? user.username ?? "Player"`

11. Deprecate the `completeProfile` mutation in `web/convex/users.ts`:
    - Keep the mutation for backward compatibility (existing users may have already called it)
    - But it is no longer required for accessing the game
    - Add a comment marking it as deprecated

### Frontend Sub-Tasks

12. Delete or archive the onboarding page:
    - Remove `web/app/[locale]/onboarding/page.tsx`
    - Remove any navigation links or references to `/onboarding` in the codebase

13. Update redirect logic in `web/app/[locale]/auth/page.tsx`:
    - Change success redirect from `/onboarding` to `/game`

14. Update redirect logic in `web/app/[locale]/page.tsx` (home page):
    - Current: redirects to `/game` if `hasCompletedProfile`, else `/auth`
    - New: redirect to `/game` if authenticated (user exists), else `/auth`
    - Remove the `hasCompletedProfile` condition entirely

15. Search and remove all `hasCompletedProfile` checks across the codebase:
    - Check game page, layout files, and any other components that gate access on profile completion
    - Replace with a simple authentication check: `if (!currentUser) → redirect to /auth`

---

## Issue 4 — Profile Defaults & Fallbacks

**Problem:** With onboarding removed, new users may not have a `displayName` or avatar set. UI components that display player names and avatars need sensible fallbacks.

**Requirement:** Ensure all users have a usable display name and avatar (or fallback) without manual setup. Profile customization remains available exclusively through the Settings page.

### Frontend Sub-Tasks

16. Verify avatar fallback in `web/components/ui/avatar-circle.tsx`:
    - When `avatarUrl` is `null` or `undefined`, the component should generate an initials-based avatar using `displayName` or `username`
    - If this fallback already exists (likely), no changes needed — just verify
    - If not, add initials generation: take first 1-2 characters of `displayName`, uppercase, render in a colored circle

17. Update all display name rendering across the app to use fallback:
    - Pattern: `user.displayName ?? user.username ?? "Player"`
    - Check: game lobby player list, in-game player cards, chat messages, game results
    - Ensure the Settings page (T23) remains the only place where `displayName` and avatar can be edited

---

## Acceptance Criteria

- [ ] Users can log in with any non-empty password (no minimum length requirement)
- [ ] Attempting to log in with a non-existent username automatically creates the account
- [ ] No "Sign In" / "Sign Up" mode toggle on the auth page — single unified flow
- [ ] Users are redirected directly to `/game` after authentication (no onboarding page)
- [ ] The `/onboarding` route is removed
- [ ] New users have a default display name (equal to their username) set at signup
- [ ] New users have default stats initialized at signup
- [ ] Avatar fallback (initials) works for users without a custom avatar
- [ ] Profile customization (display name, avatar) is only available in the Settings page
- [ ] Existing users with completed profiles are unaffected
- [ ] All `hasCompletedProfile` gates are removed from navigation logic
- [ ] All i18n keys updated for EN and AR
- [ ] No regressions in existing game flow or authentication
