import { getBattlesStore, BattleFeedItem } from "@/lib/server/memoryStore";
import { dbListBattleItems } from "@/lib/server/persistence";

const SAMPLE_THUMBNAIL = "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg";

function resolveApiKey(): string | null {
  const raw =
    (process.env.GOOGLE_API_KEY ||
      process.env.YOUTUBE_API_KEY ||
      process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
      "").trim();

  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("your_api_key") || lower.includes("changeme")) return null;
  return raw;
}

export async function fetchYouTubeSearch(params: URLSearchParams) {
  const apiKey = resolveApiKey();
  if (!apiKey) return null;

  const url = `https://youtube.googleapis.com/youtube/v3/search?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function fetchYouTubeVideo(videoId: string) {
  const apiKey = resolveApiKey();
  if (!apiKey) return null;
  const params = new URLSearchParams({
    part: "snippet,contentDetails",
    id: videoId,
    key: apiKey,
    maxResults: "1",
  });
  const res = await fetch(`https://youtube.googleapis.com/youtube/v3/videos?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getYouTubeVideoDetails(videoId: string) {
  const json = await fetchYouTubeVideo(videoId);
  if (json && Array.isArray(json.items) && json.items[0]) {
    return { items: json.items };
  }

  // Fallback to a minimal stub so the UI can continue to function
  return {
    items: [
      {
        id: videoId,
        snippet: {
          title: "Matrix stream",
          channelTitle: "TapTap Surf",
          thumbnails: {
            medium: { url: SAMPLE_THUMBNAIL },
            high: { url: SAMPLE_THUMBNAIL },
          },
        },
        contentDetails: {},
      },
    ],
  };
}

export function mapBattlesToItems(): BattleFeedItem[] {
  return getBattlesStore().items;
}

export async function loadBattleItemsFallback(): Promise<BattleFeedItem[]> {
  try {
    const fromDb = await dbListBattleItems();
    if (fromDb.length) {
      return fromDb.map((item) => ({
        id: item.videoId,
        title: item.title,
        channelTitle: item.channelTitle || "",
        channelId: item.channelId || "",
        publishedAt: item.publishedAt ? item.publishedAt.toISOString() : new Date().toISOString(),
        thumbnail: item.thumbnail || undefined,
        url: item.url || undefined,
      }));
    }
  } catch (err) {
    console.error("[battles] Failed to load DB fallback items", err);
  }

  return mapBattlesToItems();
}
