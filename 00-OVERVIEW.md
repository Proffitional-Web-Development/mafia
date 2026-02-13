# Game Project — Sub-Agents & Task Distribution Plan

## Sub-Agents

| ID | Agent Name | Role Description |
|----|-----------|-----------------|
| A1 | **Backend Architect** | Designs and implements all Convex backend: schema, mutations, queries, server-authoritative game logic, security rules, and real-time subscriptions. Owns the state machine, role assignment, voting logic, and win-condition evaluation. |
| A2 | **Frontend UI Engineer** | Builds all React/Next.js pages and components: lobby, game board, voting UI, phase transitions, role reveal cards, and result screens. Implements responsive design, animations, and accessibility. |
| A3 | **i18n & RTL Specialist** | Handles full bilingual (Arabic/English) support, RTL/LTR layout switching, translation files, locale-aware formatting, and ensures every UI component renders correctly in both directions. |
| A4 | **Auth & Identity Engineer** | Implements the authentication system: signup, login, session management, user profiles (username, avatar), integration with Convex auth, and persistent player identity across games. |
| A5 | **Game Logic Designer** | Refines and documents the game rules engine: role abilities, phase transitions, edge cases, timing constraints, reconnection logic, and produces test scenarios/acceptance criteria for every game state. |
| A6 | **QA & Security Agent** | Designs and executes test plans: anti-cheat validation, role-leakage prevention, race-condition testing, action-deadline enforcement, load testing, and security audit of client-server boundaries. |
| A7 | **DevOps & Infra Agent** | Sets up the project scaffolding, CI/CD pipelines, environment configuration, Convex deployment, preview environments, monitoring, and production readiness. |

## Task Summary

See individual task files in the `tasks/` folder. Each task file contains:
- Task ID and title
- Description and acceptance criteria
- Recommended sub-agent
- Dependencies
- Priority (P0 = critical path, P1 = important, P2 = nice-to-have)
- Estimated complexity (S/M/L/XL)

## Dependency Graph (High Level)

```
T01 (Project Setup) ──► T02 (Schema) ──► T04 (Auth) ──► T06 (Room System)
                           │                                    │
                           ▼                                    ▼
                        T03 (State Machine) ──► T07 (Card Distribution)
                                                       │
                                    ┌──────────────────┼──────────────────┐
                                    ▼                  ▼                  ▼
                              T08 (Discussion)   T09 (Voting)    T10 (Abilities)
                                    │                  │                  │
                                    └──────────────────┼──────────────────┘
                                                       ▼
                                              T11 (Mafia Voting)
                                                       ▼
                                              T12 (Resolution)
                                                       ▼
                                              T13 (Win Check)
                                                       │
                              ┌─────────────────┬──────┴───────┬──────────────┐
                              ▼                 ▼              ▼              ▼
                        T05 (i18n Setup)  T14 (UI Pages) T15 (Security) T16 (Reconnection)
                              │                 │
                              ▼                 ▼
                        T17 (RTL Polish)  T18 (Mobile Responsive)
                                                ▼
                                          T19 (E2E Tests)
                                                ▼
                                          T20 (Deployment)
```
