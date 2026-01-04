import { NextRequest, NextResponse } from "next/server";

// Top 10 Battle League Channel IDs
const BATTLE_LEAGUE_CHANNELS = [
  "UCYkq8J0QmS9B3rR9f7D7xVg", // Ultimate Rap League (URL)
  "UCQ7Dq9PSQw-DAKjN9Vy5ElQ", // King of the Dot (KOTD)
  "UCk0S7m8uhZ8vPZbPKQ0n2GQ", // BullPen Battle League
  "UCpQeZLAqM6TZcX5q6T1gQLg", // Rare Breed Entertainment
  "UC6P8G98npC7Vvfy4D9Kx1lQ", // Don't Flop
  "UCjOdmBHQIb8MpWXkNgIFvjA", // iBattle Worldwide
  "UCfJPoMdKPDQF8_-5gUfGEOw", // Grind Time Now
  "UCBGOjhWGwJKzJhvrjcnw8dA", // FlipTop Battle League
  "UCvdMROIz8bMzNzJuVCE8Qeg", // Versus Battle League
  "UCYkq8J0QmS9B3rR9f7D7xVg", // SMACK/URL (duplicate for more URL content)
];

const API_KEY = process.env.YOUTUBE_API_KEY;
const YT_API_BASE = "https://www.googleapis.com/youtube/v3";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const sort = searchParams.get("sort") || "recent";
  const q = searchParams.get("q");
  const maxResults = parseInt(searchParams.get("maxResults") || "24");

  if (!API_KEY) {
    return NextResponse.json({
      error: "YouTube API key not configured",
      items: []
    }, { status: 500 });
  }

  try {
    let allItems: any[] = [];

    if (q && q.trim()) {
      // If there's a search query, search across all battle league channels
      const searchResults = await searchBattleChannels(q.trim(), sort, maxResults);
      allItems = searchResults;
    } else {
      // Fetch from specific battle league channels
      const channelResults = await fetchFromBattleChannels(sort, maxResults);
      allItems = channelResults;
    }

    // Filter for battle-related content
    const battleItems = allItems.filter(item =>
      item.title && (
        item.title.toLowerCase().includes('vs') ||
        item.title.toLowerCase().includes('battle') ||
        item.title.toLowerCase().includes('vs.') ||
        item.title.toLowerCase().includes('versus')
      )
    );

    // Sort and limit results
    const sortedItems = sort === "popular"
      ? battleItems.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      : battleItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const limitedItems = sortedItems.slice(0, maxResults);

    return NextResponse.json({
      items: limitedItems,
      total: limitedItems.length,
      source: q ? 'search' : 'channels'
    }, {
      headers: { "Cache-Control": "no-store" }
    });

  } catch (error: any) {
    console.error("[battles] API error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch battles",
      items: []
    }, { status: 500 });
  }
}

async function fetchFromBattleChannels(sort: string, maxResults: number) {
  const allItems: any[] = [];
  const itemsPerChannel = Math.ceil(maxResults / BATTLE_LEAGUE_CHANNELS.length);

  for (const channelId of BATTLE_LEAGUE_CHANNELS) {
    try {
      const url = `${YT_API_BASE}/search?` + new URLSearchParams({
        key: API_KEY!,
        part: "snippet",
        channelId,
        type: "video",
        order: sort === "popular" ? "viewCount" : "date",
        maxResults: String(itemsPerChannel),
        q: "battle vs",
        safeSearch: "none"
      });

      const response = await fetch(url);
      const data = await response.json();

      if (data.items) {
        const items = data.items.map((item: any) => ({
          id: item.id?.videoId || "",
          title: item.snippet?.title || "",
          channelTitle: item.snippet?.channelTitle || "",
          channelId: item.snippet?.channelId || "",
          publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
          thumbnail: item.snippet?.thumbnails?.high?.url ||
                    item.snippet?.thumbnails?.medium?.url ||
                    item.snippet?.thumbnails?.default?.url,
          url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined,
        })).filter((item: any) => item.id && item.title);

        allItems.push(...items);
      }
    } catch (error) {
      console.error(`[battles] Error fetching from channel ${channelId}:`, error);
    }
  }

  return allItems;
}

async function searchBattleChannels(query: string, sort: string, maxResults: number) {
  const channelFilter = BATTLE_LEAGUE_CHANNELS.map(id => `channelId:${id}`).join(' OR ');
  const searchQuery = `${query} battle vs (${channelFilter})`;

  const url = `${YT_API_BASE}/search?` + new URLSearchParams({
    key: API_KEY!,
    part: "snippet",
    type: "video",
    order: sort === "popular" ? "viewCount" : "date",
    maxResults: String(maxResults),
    q: searchQuery,
    safeSearch: "none"
  });

  const response = await fetch(url);
  const data = await response.json();

  if (!data.items) return [];

  return data.items.map((item: any) => ({
    id: item.id?.videoId || "",
    title: item.snippet?.title || "",
    channelTitle: item.snippet?.channelTitle || "",
    channelId: item.snippet?.channelId || "",
    publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    thumbnail: item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url,
    url: item.id?.videoId ? `https://www.youtube.com/watch?v=${item.id.videoId}` : undefined,
  })).filter((item: any) => item.id && item.title);
}
