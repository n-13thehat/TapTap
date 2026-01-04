// Central defaults for the TapTap 'Music For The Future' bucket and STEMSTATION stems.
const SUPABASE_PROJECT = "gffzfwfprcbwirsjdbvn";
const PUBLIC_BASE =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    `https://${SUPABASE_PROJECT}.supabase.co`).replace(/\/+$/, "");

export const DEFAULT_ALBUM_BUCKET =
  process.env.TAPGAME_DEFAULT_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_TAPGAME_DEFAULT_BUCKET?.trim() ||
  "Default Album Music For The Future";
export const DEFAULT_ALBUM_NAME =
  process.env.TAPGAME_DEFAULT_ALBUM?.trim() ||
  process.env.NEXT_PUBLIC_TAPGAME_DEFAULT_ALBUM?.trim() ||
  "Music For The Future - Vx9";
export const DEFAULT_ALBUM_ARTIST = process.env.TAPGAME_DEFAULT_ARTIST?.trim() || "VX9";
export const DEFAULT_STEMSTATION_ALBUM =
  process.env.NEXT_PUBLIC_STEMSTATION_DEFAULT_ALBUM ?? DEFAULT_ALBUM_NAME;
export const DEFAULT_ALBUM_STORAGE_DASHBOARD_URL =
  "https://supabase.com/dashboard/project/gffzfwfprcbwirsjdbvn/storage/files/buckets/Default%20Album%20Music%20For%20The%20Future";
export const DEFAULT_ALBUM_SUPABASE_PUBLIC_BASE = PUBLIC_BASE;
export const DEFAULT_ALBUM_LOCAL_DIR =
  process.env.TAPGAME_DEFAULT_ALBUM_LOCAL_DIR?.trim() ||
  "app/api/library/albums/Music For The Future -vx9";

export function getDefaultAlbumPublicUrl(fileName: string) {
  return `${DEFAULT_ALBUM_SUPABASE_PUBLIC_BASE}/storage/v1/object/public/${encodeURIComponent(
    DEFAULT_ALBUM_BUCKET
  )}/${encodeURIComponent(fileName)}`;
}

export function buildPublicUrlForStorageKey(storageKey: string) {
  const segments = storageKey
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  return `${DEFAULT_ALBUM_SUPABASE_PUBLIC_BASE}/storage/v1/object/public/${segments.join("/")}`;
}
