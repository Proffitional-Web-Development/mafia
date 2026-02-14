# Deployment Guide — Mafia Game

## Architecture

```
┌─────────────┐      ┌─────────────────┐      ┌──────────────────┐
│   Vercel     │◄────►│   Convex Cloud  │      │   Sentry         │
│  (Next.js)   │      │  (Backend/DB)   │      │  (Error Track.)  │
└──────┬───────┘      └────────┬────────┘      └──────────────────┘
       │                       │
       └───── Custom Domain ───┘
```

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 20
- A [Convex](https://convex.dev/) account with a production project
- A [Vercel](https://vercel.com/) account
- A [Sentry](https://sentry.io/) project (optional but recommended)
- A [GitHub](https://github.com/) repository with this codebase

---

## 1. Convex Production Setup

### Create Production Deployment

```bash
cd web
npx convex deploy --prod
```

This will prompt you to select or create a production deployment.

### Set Environment Variables in Convex Dashboard

Go to **Convex Dashboard → Settings → Environment Variables** and add:

| Variable              | Description                |
|-----------------------|----------------------------|
| `AUTH_GOOGLE_ID`      | Google OAuth Client ID     |
| `AUTH_GOOGLE_SECRET`  | Google OAuth Client Secret |

### Verify Cron Jobs

After deployment, check **Convex Dashboard → Cron Jobs** to confirm:
- `cleanup stale rooms` (every 15 min)
- `cleanup expired rooms (3h)` (every 30 min)
- `cleanup expired rate limits` (every 1 hour)

---

## 2. Vercel Deployment

### Link Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Set **Root Directory** to `web`
4. Framework Preset: **Next.js**

### Environment Variables in Vercel

Add these in **Vercel → Project Settings → Environment Variables**:

| Variable                  | Scope       | Value                                    |
|---------------------------|-------------|------------------------------------------|
| `NEXT_PUBLIC_CONVEX_URL`  | All         | `https://<slug>.convex.cloud`            |
| `CONVEX_DEPLOY_KEY`       | Production  | From Convex Dashboard → Deploy Keys      |
| `NEXT_PUBLIC_SENTRY_DSN`  | All         | Sentry DSN (optional)                    |
| `SENTRY_ORG`              | All         | Sentry org slug (optional)               |
| `SENTRY_PROJECT`          | All         | Sentry project slug (optional)           |
| `SENTRY_AUTH_TOKEN`       | All         | Sentry auth token (optional)             |
| `NEXT_PUBLIC_APP_VERSION` | All         | e.g., `1.0.0`                            |

### Custom Domain

1. Go to **Vercel → Project Settings → Domains**
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. SSL is automatically provisioned

---

## 3. GitHub Actions CI/CD

### Required GitHub Secrets

Go to **GitHub → Repository → Settings → Secrets → Actions** and add:

| Secret               | Value                                       |
|----------------------|---------------------------------------------|
| `CONVEX_DEPLOY_KEY`  | Production deploy key from Convex Dashboard |
| `NEXT_PUBLIC_CONVEX_URL` | Convex production URL                  |
| `VERCEL_ORG_ID`      | From `.vercel/project.json` or dashboard    |
| `VERCEL_PROJECT_ID`  | From `.vercel/project.json` or dashboard    |
| `VERCEL_TOKEN`       | Vercel personal access token                |
| `PRODUCTION_URL`     | Your production URL (for health checks)     |

### How CI/CD Works

- **On PR**: Runs lint + typecheck + build. Deploys Convex preview.
- **On merge to `main`**: Deploys Convex functions first, then Vercel production, then runs a health check.

### Branch Protection (Recommended)

In **GitHub → Settings → Branches → Branch protection rules** for `main`:
- ✅ Require status checks to pass (select `Lint & Type-Check` and `Build`)
- ✅ Require branches to be up to date
- ✅ Require pull request reviews

---

## 4. Monitoring & Error Tracking

### Sentry

Error tracking is pre-configured. Once you set `NEXT_PUBLIC_SENTRY_DSN`:
- Client errors are captured automatically
- Server/Edge errors are captured via instrumentation
- The `global-error.tsx` boundary catches unhandled React errors
- Source maps are uploaded during CI builds when `SENTRY_AUTH_TOKEN` is set

### Uptime Monitoring

The `/api/health` endpoint returns a 200 JSON response:
```json
{ "status": "ok", "timestamp": "...", "version": "..." }
```

Configure [UptimeRobot](https://uptimerobot.com/) or [BetterUptime](https://betteruptime.com/):
- **URL**: `https://your-domain.com/api/health`
- **Check interval**: 5 minutes
- **Alert**: Slack / Email / SMS

### Convex Dashboard

Monitor in the [Convex Dashboard](https://dashboard.convex.dev/):
- Function execution times
- Error rates and logs
- Cron job execution history
- Database usage & storage

---

## 5. Pre-Launch Checklist

- [ ] Production Convex deployment created and functions deployed
- [ ] Vercel project linked, builds passing
- [ ] Custom domain + SSL configured
- [ ] All environment variables set in Vercel and Convex
- [ ] GitHub Secrets configured for CI/CD
- [ ] Branch protection rules enabled
- [ ] Sentry DSN configured, test error sent
- [ ] Uptime monitor configured on `/api/health`
- [ ] Cron jobs verified running in Convex Dashboard
- [ ] Google OAuth redirect URI updated for production domain
- [ ] Security headers verified (test with securityheaders.com)
- [ ] Mobile responsive tested on real devices
- [ ] RTL (Arabic) tested end-to-end
- [ ] Rate limiting tested (RATE_LIMITED error on abuse)
- [ ] Data cleanup verified (finished games cleaned after 1h)
- [ ] Cookie consent / privacy policy page (if applicable)

---

## Local Development

```bash
cd web
cp .env.example .env.local  # Fill in your dev values
npm install
npm run dev          # HTTP (localhost:3000)
npm run dev:https    # HTTPS (for mobile testing)
```

## Useful Commands

```bash
npx convex dev           # Start Convex dev server
npx convex deploy        # Deploy to production
npx convex codegen       # Regenerate types
npx convex logs          # Stream production logs
npx convex dashboard     # Open Convex Dashboard
```
