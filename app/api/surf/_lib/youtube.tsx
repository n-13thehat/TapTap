const API_ROOT = 'https://www.googleapis.com/youtube/v3';

function getKey(): string {
  const k = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  if (!k) throw new Error('Missing YOUTUBE_API_KEY or NEXT_PUBLIC_YOUTUBE_API_KEY');
  return k;
}

export function buildUrl(endpoint: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${API_ROOT}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  if (!url.searchParams.has('key')) url.searchParams.set('key', getKey());
  return url.toString();
}

export async function ytFetch<T = any>(endpoint: string, params: Record<string, string | number | undefined>, init?: any): Promise<T> {
  const url = buildUrl(endpoint, params);
  const res = await fetch(url, { ...init });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube API error ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export type SearchItem = {
  id?: { kind?: string; videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: { default?: { url?: string }, medium?: { url?: string } };
  };
};

export type VideoItem = {
  id?: string;
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string }, default?: { url?: string } } };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string };
};
