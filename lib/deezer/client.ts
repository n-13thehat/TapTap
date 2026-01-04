const DEEZER_BASE = "https://api.deezer.com";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

type CacheEntry<T> = { data: T; expiresAt: number };
const cache = new Map<string, CacheEntry<any>>();

function getCache<T>(key: string): T | null {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) return entry.data as T;
  if (entry) cache.delete(key);
  return null;
}

function setCache<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function fetchJson<T>(path: string, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const cached = getCache<T>(path);
  if (cached) return cached;

  const res = await fetch(`${DEEZER_BASE}${path}`);
  if (!res.ok) throw new Error(`Deezer request failed (${res.status})`);
  const json = (await res.json()) as T;
  setCache(path, json, ttlMs);
  return json;
}

export type DeezerGenre = { id: number; name: string; picture?: string; picture_small?: string };
export type DeezerArtist = { id: number; name: string; picture?: string; picture_medium?: string; link?: string };
export type DeezerTrack = {
  id: number;
  title: string;
  link?: string;
  duration?: number;
  preview?: string;
  artist?: DeezerArtist;
  album?: DeezerAlbum;
};
export type DeezerAlbum = {
  id: number;
  title: string;
  cover?: string;
  cover_medium?: string;
  cover_small?: string;
  link?: string;
  artist?: DeezerArtist;
};

type DeezerListResponse<T> = { data: T[] };

export async function getGenres(): Promise<DeezerGenre[]> {
  const res = await fetchJson<DeezerListResponse<DeezerGenre>>("/genre", DEFAULT_TTL_MS);
  return res.data || [];
}

export async function getGenreTopArtists(genreId: string | number, limit = 10): Promise<DeezerArtist[]> {
  const id = String(genreId);
  const res = await fetchJson<DeezerListResponse<DeezerArtist>>(`/genre/${id}/artists?limit=${limit}`, DEFAULT_TTL_MS);
  return res.data || [];
}

export async function getArtistTopTracks(artistId: string | number, limit = 5): Promise<DeezerTrack[]> {
  const id = String(artistId);
  const res = await fetchJson<DeezerListResponse<DeezerTrack>>(`/artist/${id}/top?limit=${limit}`, DEFAULT_TTL_MS);
  return res.data || [];
}

export async function getArtistAlbums(artistId: string | number, limit = 3): Promise<DeezerAlbum[]> {
  const id = String(artistId);
  const res = await fetchJson<DeezerListResponse<DeezerAlbum>>(`/artist/${id}/albums?limit=${limit}`, DEFAULT_TTL_MS);
  return res.data || [];
}

export async function getTrack(trackId: string | number): Promise<DeezerTrack> {
  const id = String(trackId);
  return fetchJson<DeezerTrack>(`/track/${id}`, DEFAULT_TTL_MS);
}

export async function getAlbum(albumId: string | number): Promise<DeezerAlbum> {
  const id = String(albumId);
  return fetchJson<DeezerAlbum>(`/album/${id}`, DEFAULT_TTL_MS);
}

type DeezerSearchResponse<T> = {
  data: T[];
  total?: number;
  next?: string;
};

function buildSearchPath(type: string, query: string, limit = 25, index = 0) {
  const encoded = encodeURIComponent(query);
  const base = type === "all" ? "/search" : `/search/${type}`;
  return `${base}?q=${encoded}&limit=${limit}&index=${index}`;
}

export async function searchTracks(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<DeezerTrack>>(buildSearchPath("track", query, limit, index));
}

export async function searchAlbums(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<DeezerAlbum>>(buildSearchPath("album", query, limit, index));
}

export async function searchArtists(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<DeezerArtist>>(buildSearchPath("artist", query, limit, index));
}

export async function searchPlaylists(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<any>>(buildSearchPath("playlist", query, limit, index));
}

export async function searchShows(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<any>>(buildSearchPath("podcast", query, limit, index));
}

export async function searchEpisodes(query: string, limit = 25, index = 0) {
  return fetchJson<DeezerSearchResponse<any>>(buildSearchPath("episode", query, limit, index));
}

export async function searchAll(query: string, limit = 5) {
  const [tracks, albums, artists, playlists] = await Promise.all([
    searchTracks(query, limit),
    searchAlbums(query, limit),
    searchArtists(query, limit),
    searchPlaylists(query, limit),
  ]);
  return { tracks: tracks.data, albums: albums.data, artists: artists.data, playlists: playlists.data };
}
