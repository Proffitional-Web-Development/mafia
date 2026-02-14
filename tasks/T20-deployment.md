# T20 — Deployment & Production Readiness

| Field | Value |
|-------|-------|
| **Agent** | A7 — DevOps & Infra Agent |
| **Priority** | P1 |
| **Complexity** | M |
| **Dependencies** | T19 |

## Description

Deploy the application to production with monitoring, error tracking, and CI/CD.

## Sub-Tasks

### CI/CD Pipeline

1. Set up GitHub Actions (or equivalent):
   - Lint + type-check on PR
   - Auto-deploy to preview on PR (Vercel preview + Convex dev)
   - Auto-deploy to production on merge to `main`
2. Branch protection: require passing checks before merge

### Hosting & Deployment

3. Deploy Next.js frontend to Vercel
4. Deploy Convex backend to Convex Cloud (production project)
5. Configure custom domain + SSL
6. Set up environment variables in Vercel and Convex dashboards
7. Configure Convex cron jobs (room cleanup, etc.) for production

### Monitoring & Observability

8. Set up error tracking (Sentry) for frontend and Convex functions
9. Add basic analytics: games created, games completed, average players per game
10. Convex dashboard monitoring: function execution times, error rates
11. Set up uptime monitoring (e.g., BetterUptime, UptimeRobot)
12. Add structured logging in critical Convex functions

### Pre-Launch Checklist

13. Security audit completed (T15)
14. All E2E tests passing (T19)
15. RTL audit completed (T17)
16. Mobile audit completed (T18)
17. Load test with simulated 30-player room
18. Backup strategy for Convex data
19. GDPR/privacy considerations: cookie consent, data deletion capability
20. Rate limiting configured for production

## Acceptance Criteria

- [ ] Production deployment accessible via custom domain
- [ ] CI/CD pipeline runs on every PR and merge
- [ ] Error tracking captures and reports issues
- [ ] Monitoring alerts configured
- [ ] Pre-launch checklist 100% complete
- [ ] Performance under load acceptable
