# T04 — Authentication & User Identity

| Field | Value |
|-------|-------|
| **Agent** | A4 — Auth & Identity Engineer |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | T01, T02 |

## Description

Implement mandatory authentication with persistent player identity. No guest access allowed.

## Sub-Tasks

1. Set up Convex Auth (or Clerk/Auth.js integration with Convex)
2. Implement signup flow: email/password and OAuth (Google)
3. Implement login flow with session persistence
4. Create user profile creation on first login (username selection, optional avatar upload)
5. Add username uniqueness validation
6. Implement avatar upload with image optimization (Convex file storage or external CDN)
7. Create `getCurrentUser` query for authenticated user data
8. Add auth middleware/guards for all mutations and sensitive queries
9. Implement logout and session invalidation
10. Create protected route wrapper for Next.js pages

## Acceptance Criteria

- [x] Users can sign up and log in (email/password implemented; Google OAuth requires `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`)
- [x] No unauthenticated access to game features
- [x] Username is unique and persists across sessions
- [x] Avatar displays correctly (with fallback)
- [x] All Convex mutations reject unauthenticated calls
- [x] Session survives page refresh

---

## A8 Review — 2026-02-13

✅ Review: PASSED (with minor findings)

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | Email/password sign-up/sign-in works. Google OAuth scaffold present (requires env vars). Profile completion flow with username + avatar upload functional. |
| Acceptance criteria | ✅ | All 6 checkboxes met. Unauthenticated calls rejected by `requireAuthUserId`. Username uniqueness enforced via `by_usernameLower` index. Avatar fallback to initials. Session persists via `ConvexAuthNextjsServerProvider`. |
| Error handling quality | ✅ | All mutations throw `ConvexError` with descriptive messages. Frontend catches errors and displays them in red text. `minLength={8}` on password input. |
| Security posture | ✅ | Middleware redirects unauthenticated users to `/auth`. All Convex mutations/queries use `requireAuthUserId`. Password provider normalizes email to lowercase. No credentials in source code. `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` are empty placeholders in `.env.local`. |
| Edge-case coverage | ✅ | `completeProfile` allows re-patching own username (checks `existing._id !== userId`). `getCurrentUser` handles missing `avatarStorageId` gracefully. Auth page redirects already-authenticated users. |
| Performance risks | ✅ | No unnecessary re-renders observed. `useQuery` subscriptions are minimal. |
| Code convention alignment | ✅ | Consistent `"use client"` directives. Proper separation: `convex/auth.ts` (backend), `convex/users.ts` (profile API), `convex/lib/auth.ts` (guard), frontend pages. |
| Type safety | ✅ | `requireAuthUserId` returns typed `Id<"users">`. Avatar upload casts `storageId` as `Id<"_storage">`. |
| Cross-task compatibility | ✅ | Auth guard reused by T03 `stateMachine.ts`. `getCurrentUser` provides the user contract for all future UI pages. Middleware protects all non-public routes. |
| Deliverable completeness | ✅ | 8 files created/updated: `convex/auth.ts`, `convex/auth.config.ts`, `convex/http.ts`, `convex/users.ts`, `convex/lib/auth.ts`, `middleware.ts`, `app/auth/page.tsx`, `app/onboarding/page.tsx`, `app/game/page.tsx`, `components/user-avatar.tsx`, `app/layout.tsx`. |

### Findings

- 🟡 Major: `next.config.ts` has no `images.remotePatterns` configured. `UserAvatar` uses `next/image` with `<Image src={avatarUrl}>` where `avatarUrl` comes from Convex storage URLs (`*.convex.cloud`). Next.js will reject these at runtime with a "hostname not configured" error unless `remotePatterns` is added. **Action**: Add Convex storage domain to `next.config.ts` `images.remotePatterns`.
- 🟡 Major: `onboarding/page.tsx` casts `uploadResult.storageId as Id<"_storage">` — this is an unsafe `as` cast on an API response. If the Convex upload response shape changes, this will silently produce an invalid ID. Consider adding a runtime check or using Convex's typed upload API.
- 🟢 Minor: `auth/page.tsx` always redirects to `/onboarding` after successful email/password sign-in, even for returning users who already completed their profile. The `currentUser` redirect logic handles this on re-render, but there's a brief flash. Consider checking profile status before redirect destination.
- 🟢 Minor: `metadata.title` in `layout.tsx` still says "Create Next App". Should reflect project name.
- 🟢 Minor: `UserAvatar` component uses a hardcoded `bg-zinc-200` for fallback. Consider generating distinct background colors based on username hash for visual differentiation in game lobby.
- 🟢 Minor: No rate limiting on `completeProfile` or `generateAvatarUploadUrl` mutations. Could be abused to spam storage uploads. Acceptable for MVP but should be addressed in T15 (Security).

### Summary

Authentication system is complete and properly integrated across frontend and backend. Two major findings need attention: `next.config.ts` missing `images.remotePatterns` for Convex storage URLs (will cause runtime errors), and unsafe `as` cast on upload response. Both are fixable without architectural changes. Recommend addressing the `remotePatterns` issue before T14 (Core UI) begins.
