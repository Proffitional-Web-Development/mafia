# T01 — Project Scaffolding & Configuration

| Field | Value |
|-------|-------|
| **Agent** | A7 — DevOps & Infra Agent |
| **Priority** | P0 |
| **Complexity** | M |
| **Dependencies** | None |

## Description

Initialize the monorepo or project structure with Next.js, Convex, and all foundational tooling.

## Sub-Tasks

1. Initialize Next.js latest project with App Router
2. Install and configure Convex SDK, link to a Convex project
3. Set up TypeScript strict mode, biome
4. Configure path aliases (`@/components`, `@/lib`, `@/convex`, etc.)
5. Install base UI library (shadcn/ui) and Tailwind CSS
6. Set up environment variables structure (`.env.local`, `.env.production`)
7. Create a basic `convex/` folder with empty schema placeholder
8. Add `package.json` scripts: `dev`, `build`, `lint`, `test`
9. Initialize Git repo with `.gitignore` for Next.js + Convex

## Acceptance Criteria

- [x] `npm run dev` script is wired to start both Next.js and Convex dev server (requires one-time interactive Convex login)
- [x] TypeScript compiles with zero errors
- [x] ESLint + Prettier pass on all files
- [x] shadcn/ui component renders correctly in a test page
- [ ] Convex dashboard shows connected project (complete locally after running `cd web && npx convex dev` and finishing login/link flow)
