# TapTap Matrix ZION – Launch Checklist

## Pre-Launch
- [ ] Normalize `.env.local` (single `DATABASE_URL`, single `NEXTAUTH_SECRET`, no duplicates or malformed lines).
- [ ] Run `pnpm prisma generate` and `pnpm prisma:push` against staging database.
- [ ] Run `pnpm db:seed` if you want baseline data.
- [ ] Start app with `pnpm dev` and verify `/api/health?detailed=true` returns healthy for database and cache.
- [ ] Run `pnpm test` and ensure all tests pass.
- [ ] Manually QA core flows on desktop and mobile:
  - [ ] `/` (landing / featured)
  - [ ] `/ai`
  - [ ] `/upload`
  - [ ] `/dm`
  - [ ] `/posterize`
  - [ ] `/mainframe`
  - [ ] `/settings`
  - [ ] `/library`
  - [ ] `/marketplace`
  - [ ] `/social`
  - [ ] `/battles`
- [ ] Confirm admin tools work: backfill default album, generate audio metadata, queue waveforms.

## Security & Config
- [ ] Ensure `.env.local` and any secrets files are git-ignored.
- [ ] Rotate any secrets used for real services (Supabase, API keys, email, etc.) after testing.
- [ ] Review route-to-role access matrix and verify `/api/admin/**` and admin UIs are ADMIN-only.
- [ ] Confirm all API inputs are validated (Zod) and file uploads enforce type/size limits.
- [ ] Verify logs do not contain sensitive data.

## Deployment & Observability
- [ ] Build app with `pnpm build` and fix any build-time errors.
- [ ] Verify Dockerfile (and docker-compose if used) can run the app in production mode.
- [ ] Set up CI to run lint, typecheck, test, and build on PRs and main.
- [ ] Deploy to staging and confirm `/api/health` passes container/orchestrator health checks.
- [ ] Wire logs and metrics into your monitoring stack and configure basic alerts (error rate, latency, health endpoints).

## Feature Scope & Flags
- [ ] Decide which advanced features (battles, live streaming, astroVibes, wallet, marketplace) ship in v1.
- [ ] Ensure non-v1 features are disabled or behind feature flags / role conditions.
- [ ] Verify Socket.io real-time flows (DMs/live/battles) behave correctly when online/offline and on auth failures.

## Launch
- [ ] Promote from staging to production using the same build artifact.
- [ ] Monitor health endpoints, logs, and alerts closely for the first hours.
- [ ] Be ready with a rollback plan (previous image/build + DB backup or migration rollback).

## Post-Launch
- [ ] Capture key metrics (signups, uploads, listens, errors) for the launch window.
- [ ] Review logs and metrics for unexpected spikes or failures.
- [ ] Update docs with any lessons learned or tweaks to the runbook.

