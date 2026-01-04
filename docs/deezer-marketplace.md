# Deezer Marketplace Integration

## Goal
- Pull Deezer catalog (top 10 artists per genre, their top tracks/albums) to seed marketplace without hosting audio.
- Default pricing: singles 100 TAP, albums 1000 TAP until the artist claims their account.
- When a Deezer item is purchased, park royalties for that artist in an escrow ledger that is released when they claim.

## Data source
- Deezer public API is enough for charts/genres; OAuth is only needed for user-level scopes. Base auth URL: `https://connect.deezer.com/oauth/auth.php?app_id=APP_ID&redirect_uri=REDIRECT&perms=basic_access,email`.
- Key endpoints:
  - Genres: `GET https://api.deezer.com/genre`
  - Top artists for a genre: `GET https://api.deezer.com/genre/{id}/artists?limit=10`
  - Artist top tracks: `GET https://api.deezer.com/artist/{id}/top?limit=5`
  - Artist albums: `GET https://api.deezer.com/artist/{id}/albums?limit=3`
  - Track/album detail: `GET https://api.deezer.com/track/{id}`, `GET https://api.deezer.com/album/{id}`
- Do not store audio; use Deezer stream/preview URLs and artwork URLs directly.

## Service/API layer to add
- `lib/deezer/client.ts`:
  - Thin fetch helpers with a 5–10 minute in-memory cache, and optional `DEEZER_APP_ID/SECRET/REDIRECT_URI` for signed calls when needed.
  - Normalized types for `DeezerArtist`, `DeezerTrack`, `DeezerAlbum`, `DeezerGenre`.
- `lib/marketplace/deezerListings.ts`:
  - Map Deezer tracks/albums to `Listing`-like objects: `id` (`deezer:track:{id}` or `deezer:album:{id}`), `title`, `creatorName`, `priceTap` (100 or 1000), `cover`, `previewUrl`, `deezerUrl`, `genre`, `type`.
  - Include `royaltyKey` (`deezer:{artistId}`) to bind purchases to a parked royalty account.
- API routes:
- `GET /api/deezer/genres` -> list genres with cached data.
- `GET /api/deezer/genre-top?genreId=` -> top 10 artists + top track/album each.
- `GET /api/deezer/search?q=...&type=track|album|artist|playlist|show|episode|all&limit=` -> catalog search (mirrors deezer-cli features; optional `artist`/`album` filters).
- `GET /api/marketplace/deezer/listings?genreId=` -> marketplace-ready objects (prices baked in, no DB hit).
- `POST /api/marketplace/deezer/buy` -> register a Deezer purchase and park TAP for the artist (see royalties flow below).

## Royalties and artist claiming
- Add a lightweight escrow table (Prisma) to avoid forcing a full `User` until claimed:
  - `ExternalArtistRoyalty`: `id`, `source` (`'deezer'`), `sourceId` (artist id), `stageName`, `status` (`UNCLAIMED|CLAIMED|DISPUTED`), `pendingTap`, `claimedByUserId?`, `claimToken`, `createdAt`, `updatedAt`.
  - `ExternalRoyaltyLedger`: purchase-level rows with `listingId`, `buyerUserId`, `tapAmount`, `taxApplied`, `artistRoyaltyId`, `createdAt`.
- Purchase flow in `POST /api/marketplace/deezer/buy`:
  1) Validate listing payload (`deezerId`, `type`, `priceTap` derived server-side, not trusted from client).
  2) Upsert `ExternalArtistRoyalty` for the artist; increment `pendingTap` by net after TapTax.
  3) Log ledger row; return transaction id. (If you want on-chain later, wrap with `applyTapTaxTransfer` once the artist is claimed.)
- Claim flow:
  - `POST /api/marketplace/deezer/claim` with `claimToken` (emailed/social-verified) -> create `User` + `Artist`, create `Wallet`, transfer `pendingTap` using `applyTapTaxTransfer`, set status `CLAIMED`.
  - For disputes, set `status=DISPUTED` and freeze disbursement.

## UI integration (marketplace)
- `app/marketplace/page.tsx`: add a "Deezer Picks" rail fed by `GET /api/marketplace/deezer/listings`.
  - Show genre tabs (top 8), each renders up to 10 artists with one featured track and one album.
  - Use `priceTap` prominently; show approximate USD using `TAP_USD` hint already in the file.
  - `Buy` buttons call `POST /api/marketplace/deezer/buy` (no cart needed initially); show "Pending claim" badge on unclaimed artists.
- Keep audio heavy assets out of the bundle: load cover via Deezer URLs and use previews only on demand (hover/play button).

## Config and env
- Add to `.env.local`:
  - `DEEZER_APP_ID=...`
  - `DEEZER_APP_SECRET=...`
  - `DEEZER_REDIRECT_URI=https://yourapp.com/api/deezer/callback`
- Feature flag to ship gradually: add `deezerMarket` to `lib/features/flags.ts` and guard the new rail.

## Rollout steps
- Implement `lib/deezer/client.ts` and `lib/marketplace/deezerListings.ts`.
- Add API routes (`/api/deezer/*`, `/api/marketplace/deezer/*`) with caching and input validation.
- Extend Prisma schema with the two escrow tables, run migration, and add unit tests for royalty math.
- Wire the marketplace UI rail and a minimal purchase modal that hits the new buy endpoint.
- Build claim UI (minimal form) + email/social verification hook to send `claimToken`.
- Add tests: API route units (mock Deezer), ledger math, feature-flagged UI snapshot, and a purchase happy-path integration.
