"use server";

export type YTResult = {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  publishedAt?: string;
};

function getApiKey(): string | null {
  const raw =
    (process.env.GOOGLE_API_KEY ||
      process.env.YOUTUBE_API_KEY ||
      process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
      "").trim();

  if (!raw) return null;

  // Treat obvious placeholders as "no key"
  const lower = raw.toLowerCase();
  if (
    lower.includes("your_api_key") ||
    lower.includes("your-youtube-api-key") ||
    lower === "changeme"
  ) {
    return null;
  }

  return raw;
}

export async function getYouTubeResults(q: string): Promise<YTResult[]> {
  const apiKey = getApiKey();

  // No key or placeholder: just log + return empty so the client can use fallback results.
  if (!apiKey) {
    console.warn(
      "[surf] Missing or placeholder YouTube API key (GOOGLE_API_KEY / YOUTUBE_API_KEY / NEXT_PUBLIC_YOUTUBE_API_KEY). Returning empty results."
    );
    return [];
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: "12",
    q: q || "",
    key: apiKey,
  });

  const url = `https://youtube.googleapis.com/youtube/v3/search?${params.toString()}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = text || res.statusText || "";

      console.error(
        "[surf] YouTube search failed",
        res.status,
        msg.slice(0, 300)
      );

      // If the key is invalid or blocked, swallow the error and let the UI fall back.
      if (res.status === 400 && msg.includes("API key not valid")) {
        return [];
      }

      return [];
    }

    const json = await res.json();
    const items = Array.isArray(json.items) ? json.items : [];

    const results: YTResult[] = items
      .map((it: any) => ({
        id: it?.id?.videoId || "",
        title: it?.snippet?.title || "",
        channelTitle: it?.snippet?.channelTitle || "",
        thumbnail:
          it?.snippet?.thumbnails?.medium?.url ||
          it?.snippet?.thumbnails?.default?.url ||
          undefined,
        publishedAt: it?.snippet?.publishedAt || undefined,
      }))
      .filter((r: YTResult) => r.id && r.title);

    return results;
  } catch (err) {
    console.error("[surf] YouTube search crashed", err);
    return [];
  }
}
