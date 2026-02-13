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
2. Implement signup flow: email/password or OAuth (Google, Discord)
3. Implement login flow with session persistence
4. Create user profile creation on first login (username selection, optional avatar upload)
5. Add username uniqueness validation
6. Implement avatar upload with image optimization (Convex file storage or external CDN)
7. Create `getCurrentUser` query for authenticated user data
8. Add auth middleware/guards for all mutations and sensitive queries
9. Implement logout and session invalidation
10. Create protected route wrapper for Next.js pages

## Acceptance Criteria

- [ ] Users can sign up and log in
- [ ] No unauthenticated access to game features
- [ ] Username is unique and persists across sessions
- [ ] Avatar displays correctly (with fallback)
- [ ] All Convex mutations reject unauthenticated calls
- [ ] Session survives page refresh
