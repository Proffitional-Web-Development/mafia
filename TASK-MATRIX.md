# Task-Agent Assignment Matrix

| Task | Title | Primary Agent | Co-Agent | Priority | Complexity | Dependencies |
|------|-------|---------------|----------|----------|------------|--------------|
| T01 | Project Scaffolding | A7 DevOps | — | P0 | M | None |
| T02 | Database Schema | A1 Backend | — | P0 | L | T01 |
| T03 | Game State Machine | A1 Backend | A5 Game Logic | P0 | XL | T02 |
| T04 | Authentication | A4 Auth | — | P0 | M | T01, T02 |
| T05 | i18n Foundation | A3 i18n/RTL | — | P0 | M | T01 |
| T06 | Room System | A1 Backend | A2 Frontend | P0 | L | T02, T04 |
| T07 | Card Distribution | A1 Backend | A5 Game Logic | P0 | M | T03, T06 |
| T08 | Discussion Phase | A2 Frontend | A1 Backend | P0 | S | T03, T07 |
| T09 | Public Voting | A1 Backend | A2 Frontend | P0 | L | T08 |
| T10 | Ability Phase | A1 Backend | A2 Frontend | P0 | L | T09 |
| T11 | Mafia Voting | A1 Backend | A2 Frontend | P0 | M | T10 |
| T12 | Resolution Phase | A1 Backend | A5 Game Logic | P0 | M | T11 |
| T13 | Win Condition | A1 Backend | A5 Game Logic | P0 | M | T12 |
| T14 | Core UI Pages | A2 Frontend | — | P0 | XL | T04, T05, T06 |
| T15 | Security & Anti-Cheat | A6 QA/Security | A1 Backend | P0 | L | T03, T07-T11 |
| T16 | Reconnection | A1 Backend | A2 Frontend | P1 | M | T03, T09 |
| T17 | RTL Polish | A3 i18n/RTL | — | P1 | M | T05, T14 |
| T18 | Mobile Responsive | A2 Frontend | — | P1 | M | T14 |
| T19 | E2E Testing | A6 QA/Security | A5 Game Logic | P1 | L | T13, T15 |
| T20 | Deployment | A7 DevOps | — | P1 | M | T19 |

## Agent Workload Summary

| Agent | Primary Tasks | Co-Agent Tasks | Total Involvement |
|-------|--------------|----------------|-------------------|
| A1 Backend Architect | 10 | 2 | 12 |
| A2 Frontend UI Engineer | 3 | 5 | 8 |
| A3 i18n/RTL Specialist | 2 | 0 | 2 |
| A4 Auth Engineer | 1 | 0 | 1 |
| A5 Game Logic Designer | 0 | 5 | 5 |
| A6 QA/Security Agent | 2 | 0 | 2 |
| A7 DevOps Agent | 2 | 0 | 2 |

## Suggested Execution Phases

### Phase 1 — Foundation (Week 1-2)
T01, T02, T04, T05 (can run in parallel after T01)

### Phase 2 — Core Game Loop (Week 3-5)
T03, T06, T07, T08, T09, T10, T11, T12, T13 (sequential game logic chain)

### Phase 3 — UI & Integration (Week 4-6)
T14 (starts during Phase 2), T17, T18

### Phase 4 — Hardening (Week 6-7)
T15, T16, T19

### Phase 5 — Launch (Week 7-8)
T20
