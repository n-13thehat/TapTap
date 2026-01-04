# TapTap Matrix Build ZION

Build: TapTap_Matrix_BuildID_ZION
Splash: centered “Entering TapTap Network…” over teal Matrix code

---

## 🎉 Production Ready!

**Build Status:** ✅ SUCCESS
**Last Updated:** December 19, 2025

Your application is **production-ready** and can be deployed immediately!

### ⚡ Deploy in 5 Minutes with Docker!

You already have Docker Desktop running with PostgreSQL and Redis. Deploy right now:

**👉 [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)** - Deploy in 5 minutes! ⚡⚡⚡

### 📚 All Documentation

- **[QUICK_START_DOCKER.md](QUICK_START_DOCKER.md)** ⚡⚡⚡ - Deploy with Docker (5 min)
- **[DEPLOY_WITH_DOCKER.md](DEPLOY_WITH_DOCKER.md)** 🐳 - Complete Docker guide
- **[QUICK_DEPLOY_GUIDE.md](QUICK_DEPLOY_GUIDE.md)** ☁️ - Deploy to cloud (1 hour)
- **[CURRENT_STATUS.md](CURRENT_STATUS.md)** - Executive summary
- **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)** - Complete navigation
- **[BUILD_SUCCESS_SUMMARY.md](BUILD_SUCCESS_SUMMARY.md)** - What was fixed

**Ready to deploy?** Open [QUICK_START_DOCKER.md](QUICK_START_DOCKER.md) and follow Option 1!

---

## Setup (local-first with Docker; Supabase optional)
1) Copy `.env.local.example` -> `.env.local` and keep the Docker defaults:
   - `DATABASE_URL=postgresql://postgres:password@localhost:5432/taptap_dev`
   - Supabase keys can stay empty unless you need Supabase storage/services.

2) Start local infra (recommended):
   - `docker compose up -d postgres redis`

3) Install & sync the schema against Docker Postgres:
   - `pnpm install`
   - `pnpm run prisma:push`

4) Run the app:
   - `pnpm run dev`

Assistive touch = Apple-style radial menu. Player = sticky bottom bar.  
Pages: /upload /library /marketplace /social /battles /ai (with Hope/Muse/Treasure).

## Admin Tools & Starter Album

- Default album bucket: `Default Album Music For The Future`
  - Supabase dashboard: https://supabase.com/dashboard/project/gffzfwfprcbwirsjdbvn/storage/files/buckets/Default%20Album%20Music%20For%20The%20Future
  - Default album title: `Music For The Future - Vx9`
- System artist: `VX9` (system user `vx9-system@taptap.local`)

Seed the default album to Supabase Storage:

- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE`
- Command:
  - `pnpm upload:default-album "C:\\Users\\Revolutions.Inc\\Desktop\\TapTap-Mainframe gitty\\TapTap_Matrix_BuildID_ZION\\app\\stemstation\\Music For The Future -vx9"` (only needed if you opt into Supabase storage)

Every new signup automatically receives the starter album in their Library. To backfill all existing users and add audio metadata:

- Go to `/admin/tools` (ADMIN only) and run:
  - Backfill Default Album
  - Generate Audio Metadata
  - Queue Waveforms (External) if you run an external waveform worker

Waveform integration options:

- Optional env for external worker integration:
  - `AUDIO_WAVEFORM_WEBHOOK_URL` – your worker POST endpoint
  - `AUDIO_WAVEFORM_SECRET` – shared secret used as `X-Signature`
- Worker example scripts:
  - Naive example (byte sampling): `scripts/waveform_worker_example.js`
  - ffmpeg-based example (requires ffmpeg): `scripts/waveform_worker_ffmpeg_example.js`
  - Usage: see headers in each script

### Export CSV Endpoints (ADMIN)

- Waveforms queued (default album; missing waveformId):
  - `GET /api/admin/export/waveforms-queued?limit=1000` → CSV `id,url`
- Audio metadata queued (all tracks; missing durationMs):
  - `GET /api/admin/export/audio-meta-queued?limit=1000` → CSV `id,url`
- Run and download errors (all tracks):
  - `GET /api/admin/export/generate-audio-meta-all-errors` → CSV `id,error`
- Run and download errors (default album only):
  - `GET /api/admin/export/generate-audio-meta-errors` → CSV `id,error`

### cURL Examples (Admin Endpoints)

- Backfill default album to all users:
  - `curl -X POST -b "<your_session_cookie>" http://localhost:3000/api/admin/backfill-default-album`
- Generate audio metadata (duration + placeholder waveforms):
  - `curl -X POST -b "<your_session_cookie>" http://localhost:3000/api/admin/generate-audio-meta`
- Queue waveforms to external worker (requires AUDIO_WAVEFORM_WEBHOOK_URL):
  - `curl -X POST -b "<your_session_cookie>" http://localhost:3000/api/admin/queue-waveforms?limit=50`

## Rate Limiter

- Uses Upstash Redis if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are configured; otherwise in-memory.
- Middleware-gated endpoints: `/api/surf/search`, `/api/surf/trending`, `/api/surf/video`, `/api/social/feed`

## Quality

- Scripts: `typecheck`, `lint`, `format`, `test` (Vitest)
- Tests cover utils, store, API, hooks, and UI samples
