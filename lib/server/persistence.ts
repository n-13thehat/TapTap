import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

type SurfPlaylistDb = {
  id: string;
  title: string;
  createdAt: Date;
  ownerId: string | null;
};

type SurfPlaylistItemDb = {
  id: string;
  playlistId: string;
  videoId: string;
  title: string;
  channelTitle: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
  addedAt: Date;
};

type PosterizeItemDb = {
  id: string;
  title: string;
  durationSec: number;
  mintCount: number;
  priceCents: number;
  inventory: number;
  createdAt: Date;
};

type UploadSessionDb = {
  id: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string | null;
  chunkSize: number;
  totalChunks: number;
  uploadedBytes: number;
  uploadedChunks: number[];
  status: string;
  createdAt: Date;
  finalizedAt: Date | null;
  storageKey: string | null;
};

type CreatorRequestDb = {
  id: string;
  stageName: string;
  genre: string | null;
  socialLinks: string | null;
  status: string;
  createdAt: Date;
};

type BattleFeedItemDb = {
  id: string;
  videoId: string;
  title: string;
  channelTitle: string | null;
  channelId: string | null;
  thumbnail: string | null;
  publishedAt: Date | null;
  url: string | null;
  createdAt: Date;
};

type PosterizePurchaseDb = {
  id: string;
  itemId: string;
  qty: number;
  buyerEmail: string | null;
  totalCents: number;
  createdAt: Date;
};

const ensured: Record<string, boolean> = {};

async function ensureTables(key: string, stmts: string[]) {
  if (ensured[key]) return;
  for (const sql of stmts) {
    await prisma.$executeRawUnsafe(sql);
  }
  ensured[key] = true;
}

function asNumber(v: any): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

async function ensureSurfTables() {
  await ensureTables("surf", [
    `CREATE TABLE IF NOT EXISTS surf_playlists (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      owner_id text NULL,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE TABLE IF NOT EXISTS surf_playlist_items (
      id uuid PRIMARY KEY,
      playlist_id uuid NOT NULL REFERENCES surf_playlists(id) ON DELETE CASCADE,
      video_id text NOT NULL,
      title text NOT NULL,
      channel_title text NULL,
      thumbnail text NULL,
      published_at timestamptz NULL,
      added_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_surf_playlist_items_playlist ON surf_playlist_items(playlist_id);`,
    `CREATE INDEX IF NOT EXISTS idx_surf_playlist_items_video ON surf_playlist_items(video_id);`,
  ]);
}

async function ensurePosterizeTables() {
  await ensureTables("posterize", [
    `CREATE TABLE IF NOT EXISTS posterize_items (
      id uuid PRIMARY KEY,
      title text NOT NULL,
      duration_sec int NOT NULL,
      mint_count int NOT NULL,
      price_cents int NOT NULL,
      inventory int NOT NULL,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_posterize_items_created_at ON posterize_items(created_at DESC);`,
    `CREATE TABLE IF NOT EXISTS posterize_purchases (
      id uuid PRIMARY KEY,
      item_id uuid NOT NULL REFERENCES posterize_items(id) ON DELETE CASCADE,
      qty int NOT NULL,
      buyer_email text NULL,
      total_cents int NOT NULL,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_posterize_purchases_item ON posterize_purchases(item_id);`,
  ]);
}

async function ensureUploadTables() {
  await ensureTables("upload_sessions_light", [
    `CREATE TABLE IF NOT EXISTS upload_sessions_light (
      id uuid PRIMARY KEY,
      file_name text NOT NULL,
      size_bytes bigint NOT NULL,
      mime_type text NULL,
      chunk_size int NOT NULL,
      total_chunks int NOT NULL,
      uploaded_bytes bigint NOT NULL DEFAULT 0,
      uploaded_chunks integer[] NOT NULL DEFAULT '{}',
      status text NOT NULL DEFAULT 'pending',
      storage_key text NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      finalized_at timestamptz NULL
    );`,
    `CREATE INDEX IF NOT EXISTS idx_upload_sessions_light_status ON upload_sessions_light(status);`,
  ]);
}

async function ensureCreatorTables() {
  await ensureTables("creator_requests", [
    `CREATE TABLE IF NOT EXISTS creator_requests (
      id uuid PRIMARY KEY,
      stage_name text NOT NULL,
      genre text NULL,
      social_links text NULL,
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_creator_requests_status ON creator_requests(status);`,
  ]);
}

async function ensureBattleTables() {
  await ensureTables("battle_feed_items", [
    `CREATE TABLE IF NOT EXISTS battle_feed_items (
      id uuid PRIMARY KEY,
      video_id text NOT NULL UNIQUE,
      title text NOT NULL,
      channel_title text NULL,
      channel_id text NULL,
      thumbnail text NULL,
      published_at timestamptz NULL,
      url text NULL,
      created_at timestamptz DEFAULT now()
    );`,
    `CREATE INDEX IF NOT EXISTS idx_battle_feed_items_created_at ON battle_feed_items(created_at DESC);`,
  ]);
}

export async function dbListSurfPlaylists(): Promise<SurfPlaylistDb[]> {
  await ensureSurfTables();
  const rows = await prisma.$queryRaw<
    SurfPlaylistDb[]
  >`SELECT id, title, owner_id AS "ownerId", created_at AS "createdAt" FROM surf_playlists ORDER BY created_at DESC`;
  return rows;
}

export async function dbCreateSurfPlaylist(title: string): Promise<SurfPlaylistDb> {
  await ensureSurfTables();
  const id = randomUUID();
  const rows = await prisma.$queryRaw<
    SurfPlaylistDb[]
  >`INSERT INTO surf_playlists (id, title) VALUES (${id}::uuid, ${title}) RETURNING id, title, owner_id AS "ownerId", created_at AS "createdAt"`;
  return rows[0];
}

export async function dbAddSurfPlaylistItem(
  playlistId: string,
  data: Omit<SurfPlaylistItemDb, "id" | "addedAt" | "playlistId">,
): Promise<SurfPlaylistItemDb> {
  await ensureSurfTables();
  const id = randomUUID();
  const rows = await prisma.$queryRaw<
    SurfPlaylistItemDb[]
  >`INSERT INTO surf_playlist_items (id, playlist_id, video_id, title, channel_title, thumbnail, published_at) VALUES (${id}::uuid, ${playlistId}::uuid, ${data.videoId}, ${data.title}, ${data.channelTitle}, ${data.thumbnail}, ${data.publishedAt}) RETURNING id, playlist_id AS "playlistId", video_id AS "videoId", title, channel_title AS "channelTitle", thumbnail, published_at AS "publishedAt", added_at AS "addedAt"`;
  return rows[0];
}

export async function dbListPosterizeItems(): Promise<PosterizeItemDb[]> {
  await ensurePosterizeTables();
  const rows = await prisma.$queryRaw<
    PosterizeItemDb[]
  >`SELECT id, title, duration_sec AS "durationSec", mint_count AS "mintCount", price_cents AS "priceCents", inventory, created_at AS "createdAt" FROM posterize_items ORDER BY created_at DESC LIMIT 200`;
  return rows.map((r) => ({
    ...r,
    durationSec: asNumber(r.durationSec),
    mintCount: asNumber(r.mintCount),
    priceCents: asNumber(r.priceCents),
    inventory: asNumber(r.inventory),
  }));
}

export async function dbCreatePosterizeItem(input: {
  title: string;
  durationSec: number;
  mintCount: number;
  priceCents: number;
}): Promise<PosterizeItemDb> {
  await ensurePosterizeTables();
  const id = randomUUID();
  const rows = await prisma.$queryRaw<
    PosterizeItemDb[]
  >`INSERT INTO posterize_items (id, title, duration_sec, mint_count, price_cents, inventory) VALUES (${id}::uuid, ${input.title}, ${input.durationSec}, ${input.mintCount}, ${input.priceCents}, ${input.mintCount}) RETURNING id, title, duration_sec AS "durationSec", mint_count AS "mintCount", price_cents AS "priceCents", inventory, created_at AS "createdAt"`;
  const row = rows[0];
  return {
    ...row,
    durationSec: asNumber(row.durationSec),
    mintCount: asNumber(row.mintCount),
    priceCents: asNumber(row.priceCents),
    inventory: asNumber(row.inventory),
  };
}

export async function dbPurchasePosterizeItem(input: {
  itemId: string;
  qty: number;
  buyerEmail?: string;
}): Promise<{ purchase: PosterizePurchaseDb; remaining: number }> {
  await ensurePosterizeTables();
  const qty = Math.max(1, input.qty);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const items = await tx.$queryRaw<
      PosterizeItemDb[]
    >`SELECT id, title, duration_sec AS "durationSec", mint_count AS "mintCount", price_cents AS "priceCents", inventory, created_at AS "createdAt" FROM posterize_items WHERE id = ${input.itemId}::uuid FOR UPDATE`;
    const item = items[0];
    if (!item) {
      throw new Error("Item not found");
    }
    const remaining = asNumber(item.inventory);
    if (remaining < qty) {
      throw new Error("Insufficient inventory");
    }
    await tx.$executeRaw`UPDATE posterize_items SET inventory = inventory - ${qty} WHERE id = ${input.itemId}::uuid`;
    const totalCents = asNumber(item.priceCents) * qty;
    const purchases = await tx.$queryRaw<
      PosterizePurchaseDb[]
    >`INSERT INTO posterize_purchases (id, item_id, qty, buyer_email, total_cents, created_at) VALUES (${randomUUID()}::uuid, ${input.itemId}::uuid, ${qty}, ${input.buyerEmail ?? null}, ${totalCents}, ${now}) RETURNING id, item_id AS "itemId", qty, buyer_email AS "buyerEmail", total_cents AS "totalCents", created_at AS "createdAt"`;
    return { purchase: purchases[0], remaining: remaining - qty };
  });
}

export async function dbCreateUploadSession(input: {
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  chunkSize: number;
  totalChunks: number;
}): Promise<UploadSessionDb> {
  await ensureUploadTables();
  const id = randomUUID();
  const rows = await prisma.$queryRaw<
    UploadSessionDb[]
  >`INSERT INTO upload_sessions_light (id, file_name, size_bytes, mime_type, chunk_size, total_chunks, status) VALUES (${id}::uuid, ${input.fileName}, ${input.sizeBytes}, ${input.mimeType}, ${input.chunkSize}, ${input.totalChunks}, 'pending') RETURNING id, file_name AS "fileName", size_bytes AS "sizeBytes", mime_type AS "mimeType", chunk_size AS "chunkSize", total_chunks AS "totalChunks", uploaded_bytes AS "uploadedBytes", uploaded_chunks AS "uploadedChunks", status, storage_key AS "storageKey", created_at AS "createdAt", finalized_at AS "finalizedAt"`;
  return normalizeUpload(rows[0]);
}

export async function dbGetUploadSession(id: string): Promise<UploadSessionDb | null> {
  await ensureUploadTables();
  const rows = await prisma.$queryRaw<
    UploadSessionDb[]
  >`SELECT id, file_name AS "fileName", size_bytes AS "sizeBytes", mime_type AS "mimeType", chunk_size AS "chunkSize", total_chunks AS "totalChunks", uploaded_bytes AS "uploadedBytes", uploaded_chunks AS "uploadedChunks", status, storage_key AS "storageKey", created_at AS "createdAt", finalized_at AS "finalizedAt" FROM upload_sessions_light WHERE id = ${id}::uuid LIMIT 1`;
  return rows[0] ? normalizeUpload(rows[0]) : null;
}

export async function dbMarkChunkUploaded(
  id: string,
  index: number,
  estimatedBytes: number,
): Promise<UploadSessionDb | null> {
  await ensureUploadTables();
  const rows = await prisma.$queryRaw<
    UploadSessionDb[]
  >`UPDATE upload_sessions_light
     SET uploaded_chunks = (
       SELECT ARRAY(SELECT DISTINCT UNNEST(array_append(uploaded_chunks, ${index}::int)))
     ),
     uploaded_bytes = GREATEST(uploaded_bytes, ${estimatedBytes}::bigint),
     status = 'uploading',
     updated_at = now()
     WHERE id = ${id}::uuid
     RETURNING id, file_name AS "fileName", size_bytes AS "sizeBytes", mime_type AS "mimeType", chunk_size AS "chunkSize", total_chunks AS "totalChunks", uploaded_bytes AS "uploadedBytes", uploaded_chunks AS "uploadedChunks", status, storage_key AS "storageKey", created_at AS "createdAt", finalized_at AS "finalizedAt"`;
  return rows[0] ? normalizeUpload(rows[0]) : null;
}

export async function dbFinalizeUploadSession(id: string, storageKey?: string): Promise<UploadSessionDb | null> {
  await ensureUploadTables();
  const rows = await prisma.$queryRaw<
    UploadSessionDb[]
  >`UPDATE upload_sessions_light
     SET status = 'completed',
         uploaded_bytes = size_bytes,
         storage_key = COALESCE(${storageKey ?? null}, storage_key),
         finalized_at = now(),
         updated_at = now()
     WHERE id = ${id}::uuid
     RETURNING id, file_name AS "fileName", size_bytes AS "sizeBytes", mime_type AS "mimeType", chunk_size AS "chunkSize", total_chunks AS "totalChunks", uploaded_bytes AS "uploadedBytes", uploaded_chunks AS "uploadedChunks", status, storage_key AS "storageKey", created_at AS "createdAt", finalized_at AS "finalizedAt"`;
  return rows[0] ? normalizeUpload(rows[0]) : null;
}

export async function dbCreateCreatorRequest(input: {
  stageName: string;
  genre?: string;
  socialLinks?: string;
}): Promise<CreatorRequestDb> {
  await ensureCreatorTables();
  const id = randomUUID();
  const rows = await prisma.$queryRaw<
    CreatorRequestDb[]
  >`INSERT INTO creator_requests (id, stage_name, genre, social_links, status) VALUES (${id}::uuid, ${input.stageName}, ${input.genre ?? null}, ${input.socialLinks ?? null}, 'pending') RETURNING id, stage_name AS "stageName", genre, social_links AS "socialLinks", status, created_at AS "createdAt"`;
  return rows[0];
}

export async function dbUpsertBattleItems(items: BattleFeedItemDb[]): Promise<void> {
  if (!items.length) return;
  await ensureBattleTables();
  for (const item of items) {
    const rowId = randomUUID();
    await prisma.$executeRaw`
      INSERT INTO battle_feed_items (id, video_id, title, channel_title, channel_id, thumbnail, published_at, url)
      VALUES (${rowId}::uuid, ${item.videoId}, ${item.title}, ${item.channelTitle}, ${item.channelId}, ${item.thumbnail}, ${item.publishedAt}, ${item.url})
      ON CONFLICT (video_id) DO UPDATE SET
        title = EXCLUDED.title,
        channel_title = EXCLUDED.channel_title,
        channel_id = EXCLUDED.channel_id,
        thumbnail = EXCLUDED.thumbnail,
        published_at = EXCLUDED.published_at,
        url = EXCLUDED.url;`;
  }
}

export async function dbListBattleItems(limit = 50): Promise<BattleFeedItemDb[]> {
  await ensureBattleTables();
  const rows = await prisma.$queryRaw<
    BattleFeedItemDb[]
  >`SELECT id, video_id AS "videoId", title, channel_title AS "channelTitle", channel_id AS "channelId", thumbnail, published_at AS "publishedAt", url, created_at AS "createdAt" FROM battle_feed_items ORDER BY created_at DESC LIMIT ${limit}`;
  return rows;
}

function normalizeUpload(row: UploadSessionDb): UploadSessionDb {
  return {
    ...row,
    sizeBytes: asNumber(row.sizeBytes),
    chunkSize: asNumber(row.chunkSize),
    totalChunks: asNumber(row.totalChunks),
    uploadedBytes: asNumber(row.uploadedBytes),
    uploadedChunks: Array.isArray(row.uploadedChunks)
      ? row.uploadedChunks.map((n: any) => asNumber(n))
      : [],
    storageKey: row.storageKey,
  };
}
