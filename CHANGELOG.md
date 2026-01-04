# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [1.0.0] - ZION

### Added
- Next.js app routes for admin, social, marketplace, upload, library, surf, AI (Hope/Muse/Treasure), and more.
- API routes for surf search/trending/video, tracks, social feed, wallet (Solana), marketplace buy, and admin tools.
- Starter album workflow and admin tools for backfill, audio metadata generation, and waveform queueing.
- Electron development and build scripts.
- Test suite (Vitest) covering utils, store, APIs, and sample UI components.
- Linting, typechecking, and formatting scripts.

### Fixed
- Build error in `app/settings/page.tsx` by marking it a Client Component to allow `dynamic(..., { ssr: false })`.

### Notes
- Ensure environment variables are configured per `.env.local.example`.
- Replace placeholder branding assets under `public/branding` as noted in `README.md`.

