# Sub-Agent Definitions

## A1 — Backend Architect

**Role:** Designs and implements all server-side systems using Convex. Owns the database schema, game state machine, all mutations/queries, and ensures server-authoritative logic for every game action.

**Skills Required:** Convex (real-time backend), TypeScript, state machine design, real-time systems, database modeling, security-first thinking.

**Owns Tasks:** T02, T03, T06 (backend), T07 (backend), T09 (backend), T10 (backend), T11 (backend), T12, T13 (backend), T16 (backend)

---

## A2 — Frontend UI Engineer

**Role:** Builds all React/Next.js pages, components, and interactions. Responsible for the visual game experience, responsive layouts, animations, and ensuring a polished, accessible UI.

**Skills Required:** React, Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, animation libraries (Framer Motion), responsive design, accessibility.

**Owns Tasks:** T06 (frontend), T08 (frontend), T09 (frontend), T10 (frontend), T11 (frontend), T14, T18

---

## A3 — i18n & RTL Specialist

**Role:** Ensures flawless bilingual (Arabic + English) experience. Manages translation infrastructure, RTL/LTR layout correctness, Arabic typography, and locale-aware formatting throughout the app.

**Skills Required:** next-intl or react-i18next, RTL CSS (logical properties), Arabic typography, bidirectional text handling, locale-aware UX patterns.

**Owns Tasks:** T05, T17

---

## A4 — Auth & Identity Engineer

**Role:** Implements the complete authentication flow: signup, login, session management, user profiles, and auth guards. Ensures no unauthenticated access to game features.

**Skills Required:** Convex Auth / Clerk / Auth.js, OAuth integration, session management, file upload (avatars), security best practices.

**Owns Tasks:** T04

---

## A5 — Game Logic Designer

**Role:** Refines game rules, documents edge cases, designs test scenarios, and provides acceptance criteria. Acts as the "game designer" ensuring the implementation matches the GDD intent. Reviews backend implementations for correctness.

**Skills Required:** Game design, systems thinking, edge-case analysis, technical writing, QA mindset.

**Owns Tasks:** T03 (co-agent), T07 (co-agent), T12 (co-agent), T13 (co-agent), T19 (co-agent)

---

## A6 — QA & Security Agent

**Role:** Designs and executes test plans. Performs security audits, anti-cheat testing, race-condition analysis, and E2E test implementation. Validates that no role information leaks through any channel.

**Skills Required:** Playwright/Cypress, security testing, penetration testing mindset, network inspection, load testing, CI integration.

**Owns Tasks:** T15, T19

---

## A7 — DevOps & Infra Agent

**Role:** Sets up project scaffolding, CI/CD pipelines, deployment configuration, monitoring, and production infrastructure. Ensures smooth developer experience and reliable production operations.

**Skills Required:** Vercel, Convex Cloud, GitHub Actions, Sentry, monitoring tools, DNS/SSL, environment management.

**Owns Tasks:** T01, T20

---

## A8 — Reviewer Agent

**Role:** Receives completed task outputs, audits them against acceptance criteria, project standards, and cross-task compatibility, then either approves work or returns it with specific revision instructions.

**Skills Required:** Deep code review, secure coding analysis, performance profiling, TypeScript/React/Convex architecture review, cross-module dependency validation, technical QA writing.

**Owns Tasks:** All task reviews (T01–T20), final acceptance gating, recurring issue tracking.

**Constraints:**
- Never writes implementation code directly.
- Never changes architecture or introduces new design decisions.
- Never approves tasks with unresolved 🔴 Critical issues.
- Must use a top-tier model for deep review reasoning.

