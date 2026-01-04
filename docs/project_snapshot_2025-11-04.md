# TapTap ZION — Project Snapshot (2025-11-04)

Generated at: 2025-11-04T00:00:00Z (local repo scan)

## Overview

- App: Next.js App Router (React 18, TS) with Tailwind.
- Domains: AI (Hope/Muse/Treasure), Social, Library, Upload, Marketplace, Battles, Wallet.
- Backends: Prisma (Postgres, relationMode=prisma), Supabase (auth/storage), NextAuth.
- Integrations: Solana (web3 + SPL), Venmo payments, Upstash Redis rate limiting, Sentry.
- Desktop: Minimal Electron wrapper for dev.

## Key Versions

- Node (engines): >=18.18.0
- next: 15.5.4
- typescript: ^5.6.x
- prisma/@prisma/client: ^6.17.1
- next-auth: ^4.24.x
- @supabase/supabase-js: ^2.45.x
- @solana/web3.js: ^1.98.x
- vitest: ^2.1.x

## Scripts (package.json)

- dev/build: `predev`, `dev`, `build`, `start`
- prisma: `prisma:push`, `prisma:studio`, `prisma:seed`, `db:seed`
- quality: `typecheck`, `lint`, `format`, `test`
- desktop: `electron:dev`, `electron:build`
- ops: `upload:default-album`, `solana:setup:devnet`

## App Routes (pages)

- Root and sections: `/` (home), `/home`, `/explore`, `/surf`, `/upload`, `/library`, `/library/scan`, `/marketplace`, `/creator`, `/creator/[handle]`, `/creator/request`, `/battles`, `/social`, `/wallet`, `/ai`, `/dm`, `/live`, `/settings`, `/album/[slug]`.
- Admin: `/admin`, `/admin/creator-requests`, `/admin/requests`, `/admin/tools`.

## API Routes (selected)

- Auth: `api/auth/signup`, `api/auth/[...nextauth]`
- Health: `api/health`, `api/healthz`
- Home: `api/home/featured`
- Library: `api/library/claim-tap`, `api/library/import-purchases`
- Surf: `api/surf/search`, `api/surf/trending`, `api/surf/video`, `api/surf/audio`, `api/surf/saved`, `api/surf/saved/[id]`
- Social: `api/social/feed`
- Listings/Tracks: `api/listings`, `api/tracks`
- Payments: `api/payments/venmo/create`, `api/payments/venmo/capture`, `api/payments/webhook`
- Marketplace: `api/marketplace/buy`, `api/market/solprice`, `api/market/tapprice`
- Swap: `api/swap/quote`, `api/swap/execute`, `api/swap/history`
- Treasure: `api/treasure/send`, `api/treasure/withdraw`
- Wallet (Solana): `api/wallet/solana/connect|ensure|list|balance`
- Webhooks: `api/webhooks/waveform`
- Admin (ops): backfill/generate/queue/export metrics and featured, Redis keys, Solana mint, status

Total API handlers found: 47

## Database (Prisma)

- Datasource: Postgres via `DATABASE_URL`; relationMode `prisma` (no DB FKs).
- Scope: Rich domain includes Users, Artists, Albums, Tracks, Library/Playlists, Social graph (Posts, Comments, Likes, Follows, Messages), Battles, Orders/Products/Marketplace, Notifications, Live, Analytics/Metrics, AI dialogs/tasks/profiles, Subscriptions/Tiers, Wallets/Tokens/Treasure.
- Migrations: `20251011193310_init_social` present; seed files `prisma/seed.{js,ts}`.

## Libraries and Utilities

- Supabase clients: `lib/supabase.ts`, `lib/supabaseAdmin.ts` and `app/lib/supabase.ts`
- Prisma client: `lib/prisma.ts`
- Sentry: `lib/observability/sentry.*`
- Store/state: `lib/store.tsx` (Zustand)
- Helpers: `lib/utils.tsx`, `app/lib/utils.ts`, `app/lib/models.ts`, `app/lib/types.ts`
- Solana helpers: `app/lib/solana.ts`

## UI Components (examples)

- Core UI: `components/ui/*` (button, input, dialog, dropdown, toast, etc.)
- Visuals: `components/visuals/*` (MatrixRain, GalaxyScene)
- App features: `AssistiveOrb`, `Composer`, `Player`, `Feed`, `Sidebar`, `PostCard`, `NotificationBell`
- Battles: `BattleCard`, `HeroPlayer`, `Leaderboard`, `ChatPanel`, `UnlockModal`, `WagerModal`

## Tests (Vitest)

- Coverage samples: `tests/*.test.ts(x)` including UI (badge/button), providers (matrix), store, utils, rate limiter, and API tests for surf/tracks/treasure.

## Scripts and Ops

- Env checks: `scripts/check_env.js`, `scripts/check_supabase.js`
- Featured/home data: `scripts/ensure_featured_*`
- Supabase/DB: `scripts/db_introspect.js`, `scripts/codex_supabase_sync.mjs`, SQL helpers
- Media: default album uploader, waveform worker examples (naive and ffmpeg)
- Solana: devnet setup and mint utilities
- Electron: `electron/main.js` with build/dev scripts

## Rate Limiting

- Upstash Redis (if configured), falls back to in-memory.
- Middleware targets include: `/api/surf/search`, `/api/surf/trending`, `/api/surf/video`, `/api/social/feed`.

## Environment

- Required (per README): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`
- Optional (rate limit, webhooks, Solana, email, etc.) via scripts and README notes

## What’s Implemented (Summary)

- End-to-end Next.js app with App Router, multiple feature pages (upload, library, marketplace, social, battles, AI, wallet).
- Auth via NextAuth with Prisma adapter and Supabase support wiring.
- Rich Prisma schema covering users, content graph, commerce, social, AI, and web3.
- Admin tooling endpoints for seeding/backfill, featured content, audio metadata generation, waveform queueing, metrics, and redis inspection.
- Media onboarding: default starter album flow and user backfill.
- Payments flow scaffolding with Venmo endpoints and generic webhook.
- Web3 integration: Solana wallet connect/list/ensure/balance and TAP mint endpoint.
- Surf discovery: search/trending/video/audio endpoints and saved lists.
- Observability via Sentry (client/server stubs present).
- Rate limiting middleware with optional Upstash Redis.
- DX: Electron dev wrapper, scripts for env validation, featured content, and upload utilities.
- Tests: Vitest suite across UI, store, rate limiting, and API samples.

## Notable Next Steps (suggested)

- Verify env and DB: run `pnpm prisma:push` and seed defaults.
- Wire real payment providers and webhook verification where placeholders exist.
- Ensure all admin endpoints enforce authz and are hidden in prod.
- Fill public/branding assets and production Sentry DSN.
- Expand tests for critical APIs (auth, marketplace buy, wallet ops).

