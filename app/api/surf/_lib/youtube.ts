const BASE = "https://www.googleapis.com/youtube/v3";

export type Thumbnail = { url?: string };
export type VideoItem = {
  id?: string | { videoId?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { default?: Thumbnail; medium?: Thumbnail; high?: Thumbnail };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string; likeCount?: string };
};

export async function ytFetch<T = any>(endpoint: string, params: Record<string, string | number>) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const url = new URL(`${BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  if (apiKey) url.searchParams.set("key", apiKey);
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`yt ${endpoint} failed ${r.status}`);
  return (await r.json()) as T;
}

