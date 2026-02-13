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
- [x] Convex dashboard shows connected project (complete locally after running `cd web && npx convex dev` and finishing login/link flow)

---

## A8 Review — 2026-02-13

✅ Review: PASSED

### Evaluation Checklist

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Functional correctness | ✅ | `npm run dev` wires both Next.js + Convex via `concurrently`. Build, lint, typecheck all pass. |
| Acceptance criteria | ✅ | All 5 checkboxes met. Convex linked to `dev:gallant-dragon-613`. |
| Error handling quality | ✅ | N/A for scaffolding task. |
| Security posture | ✅ | `.env*` in `.gitignore`; no secrets committed. |
| Edge-case coverage | ✅ | N/A. |
| Performance risks | ✅ | None. |
| Code convention alignment | ✅ | ESLint + Prettier + Biome configured. `eslint.config.mjs` ignores `convex/_generated/`. |
| Type safety | ✅ | TypeScript strict mode enabled in `tsconfig.json`. |
| Cross-task compatibility | ✅ | Path aliases (`@/*`, `@/components/*`, `@/lib/*`, `@/convex/*`) ready for all downstream tasks. |
| Deliverable completeness | ✅ | All sub-task outputs exist: Next.js app, Convex SDK, TS strict, Biome, path aliases, shadcn/ui (Button component), `.env.local`/`.env.production`, `convex/schema.ts`, package scripts, `.gitignore`. |

### Findings

- 🟢 Minor: `web/next.config.ts` is empty (no custom config). Acceptable for scaffolding; will need `images.remotePatterns` once Convex storage URLs are loaded in `<Image>` (flagged for T04/T14).
- 🟢 Minor: Default `metadata.title` in `layout.tsx` still reads "Create Next App". Should be updated to match the project name.
- 🟢 Minor: Root `package.json` lacks `typecheck` and `format` delegate scripts (only `dev`, `build`, `lint`, `test` are proxied).

### Summary

Scaffolding is solid. All tooling compiles cleanly. No blocking issues.
