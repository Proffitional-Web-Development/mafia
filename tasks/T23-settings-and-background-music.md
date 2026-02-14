# T23 — Settings Page & Background Music

| Field | Value |
|-------|-------|
| **Agent** | A2 — Frontend UI Engineer |
| **Co-Agent** | A1 — Backend Architect |
| **Priority** | P1 |
| **Complexity** | L |
| **Dependencies** | T04, T05, T14 |

## Description

Implement a user settings page where players can update their display name, avatar, and password. Additionally, add a background music system that plays ambient/themed music during gameplay, with a user-level toggle to enable or disable it. Music preference must persist across sessions.

---

## Issue 1 — User Settings Page (Route & Layout)

**Problem:** No settings or profile management page exists. Users can only set their display name and avatar once during onboarding, with no way to change them afterward.

**Requirement:** Create a `/[locale]/settings` page accessible from the game lobby and in-game header, allowing users to manage their profile.

### Frontend Sub-Tasks

1. Create a settings page at `web/app/[locale]/settings/page.tsx`:
   - Protected route — redirect unauthenticated users to `/auth`
   - Use the existing app layout and design system (frosted glass cards, consistent spacing)
   - Sections: Profile, Security, Preferences
   - Back navigation to the previous page (lobby or game)
2. Add a settings icon/link to the game lobby header and the in-game header:
   - Use a `settings` material icon
   - Navigate to `/settings` on click
3. Add i18n keys for the settings page in both EN and AR:
   - `"settings.title"` → "Settings" / "الإعدادات"
   - `"settings.profile.title"` → "Profile" / "الملف الشخصي"
   - `"settings.security.title"` → "Security" / "الأمان"
   - `"settings.preferences.title"` → "Preferences" / "التفضيلات"
   - `"settings.saved"` → "Changes saved" / "تم حفظ التغييرات"

---

## Issue 2 — Update Display Name

**Problem:** The `completeProfile` mutation in `users.ts` only sets the display name during onboarding. There is no mutation to update it afterward.

**Requirement:** Users must be able to change their display name from the settings page with the same validation rules as onboarding (3–32 characters).

### Backend Sub-Tasks

4. Create an `updateDisplayName` mutation in `users.ts`:
   - Requires authenticated user
   - Accepts `displayName: v.string()` argument
   - Validates length (3–32 characters), trims whitespace
   - Updates the `displayName` field on the user document
   - Returns `{ success: true }`

### Frontend Sub-Tasks

5. Add a "Display Name" section to the settings profile form:
   - Show the current display name in an editable text input
   - Validate on blur or submit (3–32 characters)
   - "Save" button calls `updateDisplayName` mutation
   - Show success banner on save, error banner on failure
   - Disable the save button when the value hasn't changed

---

## Issue 3 — Update Avatar

**Problem:** Avatar upload infrastructure exists (`generateAvatarUploadUrl`, `setAvatarFromStorage`) but there is no UI to change the avatar outside of onboarding.

**Requirement:** Users must be able to update their avatar from the settings page using the existing upload flow.

### Frontend Sub-Tasks

6. Add an "Avatar" section to the settings profile form:
   - Show the current avatar as a preview (or a placeholder if none set)
   - "Change Avatar" button opens a file picker (accept `image/*`)
   - On file select:
     1. Call `generateAvatarUploadUrl` to get an upload URL
     2. Upload the file via `fetch` PUT to the upload URL
     3. Call `setAvatarFromStorage` with the returned `storageId`
   - Show a loading spinner during upload
   - Show success/error feedback after completion
   - Limit file size to 5 MB client-side with a validation message

---

## Issue 4 — Change Password

**Problem:** Password is managed by Convex Auth (`@convex-dev/auth` Password provider) and there is no mutation or UI for changing it after signup.

**Requirement:** Users who signed up with username/password must be able to change their password from the settings page. OAuth-only users (Google) should not see this section.

### Backend Sub-Tasks

7. Create a `changePassword` mutation or action in `auth.ts` (or a dedicated `security.ts` file):
   - Requires authenticated user
   - Accepts `currentPassword: v.string()` and `newPassword: v.string()`
   - Validates the current password against the stored credential
   - Validates the new password (minimum 6 characters)
   - Updates the password via the Convex Auth password provider's credential update mechanism
   - Returns `{ success: true }` or throws an appropriate error
   - Note: If `@convex-dev/auth` does not support direct password updates, implement using the `signIn` flow with `flow: "reset"` or a custom approach — document the chosen method in code comments
8. Create a `getAuthMethod` query that returns whether the current user signed up via `"password"` or `"oauth"`:
   - Check the `authAccounts` table for the user's linked providers
   - Return `{ method: "password" | "oauth" }` so the frontend can conditionally show the password section

### Frontend Sub-Tasks

9. Add a "Change Password" section to the settings security form:
   - Only show this section if `getAuthMethod` returns `"password"`
   - Fields: "Current Password" (password input), "New Password" (password input), "Confirm New Password" (password input)
   - Client-side validation:
     - Current password required
     - New password minimum 6 characters
     - New password and confirm must match
   - "Change Password" button calls the `changePassword` mutation
   - Show success/error feedback
   - Clear the form on success

---

## Issue 5 — Background Music System

**Problem:** The game has no audio. Background music would enhance the atmosphere during gameplay.

**Requirement:** Implement a background music player that loops ambient/themed music during the game, with a persistent user preference to enable or disable it.

### Schema Changes

10. Add a `musicEnabled` field to the `users` table in `schema.ts`:
    - `musicEnabled: v.optional(v.boolean())` — defaults to `true` when not set

### Backend Sub-Tasks

11. Create a `toggleMusic` mutation in `users.ts`:
    - Requires authenticated user
    - Accepts `enabled: v.boolean()`
    - Updates the `musicEnabled` field on the user document
12. Expose `musicEnabled` in the `getCurrentUser` query response (default to `true` if field is not set)

### Frontend Sub-Tasks

13. Create a `BackgroundMusicProvider` component in `components/providers/background-music-provider.tsx`:
    - Wraps the app layout (add to the root layout or game layout)
    - Uses an `<audio>` element with `loop` and `autoplay` attributes
    - Loads a music file from `/public/audio/` (e.g. `/audio/game-ambient.mp3`)
    - Reads the user's `musicEnabled` preference from `getCurrentUser`
    - Plays or pauses based on the preference
    - Handles browser autoplay restrictions gracefully:
      - Attempt to play on mount
      - If blocked by autoplay policy, wait for the first user interaction (click/tap) and retry
    - Volume set to a comfortable background level (e.g. 0.3)
14. Add music audio files to `web/public/audio/`:
    - At least one ambient/loop track (royalty-free, suitable for a mafia-style game)
    - Recommended: a calm lobby track and a tenser in-game track (can start with one track and expand later)
    - Accepted formats: `.mp3` (widest browser support)
    - Note: Source royalty-free tracks from sites like Pixabay, Uppbeat, or similar — include attribution in a `CREDITS.md` if required by the license
15. Add a "Background Music" toggle to the settings preferences section:
    - Toggle switch (on/off) bound to the `musicEnabled` state
    - On toggle: call `toggleMusic` mutation and immediately play/pause the audio
    - Show the current state: "Enabled" / "Disabled"
    - Add i18n keys:
      - `"settings.preferences.music"` → "Background Music" / "الموسيقى الخلفية"
      - `"settings.preferences.musicEnabled"` → "Enabled" / "مفعّل"
      - `"settings.preferences.musicDisabled"` → "Disabled" / "معطّل"
16. Add a quick music toggle button to the in-game header (next to the settings icon):
    - Small speaker icon: `volume_up` when music is on, `volume_off` when off
    - Tap toggles music on/off without navigating to settings
    - Calls the same `toggleMusic` mutation

---

## Issue 6 — Settings Navigation & UX

**Problem:** Settings needs to be easily accessible and provide a smooth navigation experience.

**Requirement:** Users can access settings from the lobby and during the game, and return to where they were without losing game state.

### Frontend Sub-Tasks

17. Ensure the settings page works as a regular route (not a modal) so it has its own URL and supports browser back
18. Add a confirmation prompt if the user has unsaved changes and tries to navigate away:
    - Use `beforeunload` event or a client-side navigation guard
    - Prompt: "You have unsaved changes. Discard?" with Discard / Stay options
19. Ensure the settings page is fully responsive (mobile-friendly) and supports RTL layout for Arabic

---

## Acceptance Criteria

- [ ] Settings page exists at `/[locale]/settings` and is accessible from lobby and in-game header
- [ ] Users can update their display name (3–32 chars validation)
- [ ] Users can upload a new avatar with file size validation (5 MB max)
- [ ] Users who signed up with password can change their password
- [ ] OAuth-only users do not see the password section
- [ ] Background music plays during the game when enabled
- [ ] Music preference persists across sessions (stored server-side)
- [ ] Music toggle available in settings and as a quick button in the game header
- [ ] Browser autoplay restrictions handled gracefully (no errors, retry on interaction)
- [ ] All new i18n keys added for EN and AR locales
- [ ] Settings page is mobile-friendly and supports RTL
- [ ] Unsaved changes prompt prevents accidental data loss
- [ ] No regressions in existing auth, onboarding, or game flow
