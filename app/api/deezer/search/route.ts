import { NextResponse } from "next/server";
import { FeatureFlagManager } from "@/lib/features/flags";
import {
  searchTracks,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchShows,
  searchEpisodes,
  searchAll,
} from "@/lib/deezer/client";

export const dynamic = "force-dynamic";

async function deezerEnabled() {
  const envDisabled = String(process.env.DEEZER_MARKET_DISABLED || "").toLowerCase() === "true";
  if (envDisabled) return false;
  try {
    return await FeatureFlagManager.isEnabled("deezerMarket");
  } catch {
    return true;
  }
}

function parseLimit(searchParams: URLSearchParams) {
  const raw = Number(searchParams.get("limit") || 25);
  if (!Number.isFinite(raw)) return 25;
  return Math.max(1, Math.min(raw, 50));
}

function filterByArtist<T extends { artist?: { name?: string }; album?: { artist?: { name?: string } } }>(
  data: T[],
  artistName?: string
) {
  if (!artistName) return data;
  const needle = artistName.toLowerCase();
  return data.filter((item) => {
    const candidate = item.artist?.name || item.album?.artist?.name || "";
    return candidate.toLowerCase().includes(needle);
  });
}

function filterTracksByAlbum<T extends { album?: { title?: string } }>(data: T[], album?: string) {
  if (!album) return data;
  const needle = album.toLowerCase();
  return data.filter((item) => item.album?.title?.toLowerCase().includes(needle));
}

export async function GET(req: Request) {
  try {
    const enabled = await deezerEnabled();
    if (!enabled) return NextResponse.json({ error: "Deezer marketplace is disabled" }, { status: 503 });

    const url = new URL(req.url);
    const q = url.searchParams.get("q");
    if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

    const type = (url.searchParams.get("type") || "track").toLowerCase();
    const limit = parseLimit(url.searchParams);
    const artistFilter = url.searchParams.get("artist") || undefined;
    const albumFilter = url.searchParams.get("album") || undefined;

    switch (type) {
      case "track":
      case "tracks": {
        const res = await searchTracks(q, limit);
        let data = res.data || [];
        data = filterByArtist(data, artistFilter);
        data = filterTracksByAlbum(data, albumFilter);
        return NextResponse.json({ ok: true, type: "track", q, limit, data, total: res.total });
      }
      case "album":
      case "albums": {
        const res = await searchAlbums(q, limit);
        let data = res.data || [];
        data = filterByArtist(data, artistFilter);
        return NextResponse.json({ ok: true, type: "album", q, limit, data, total: res.total });
      }
      case "artist":
      case "artists": {
        const res = await searchArtists(q, limit);
        return NextResponse.json({ ok: true, type: "artist", q, limit, data: res.data || [], total: res.total });
      }
      case "playlist":
      case "playlists": {
        const res = await searchPlaylists(q, limit);
        return NextResponse.json({ ok: true, type: "playlist", q, limit, data: res.data || [], total: res.total });
      }
      case "show":
      case "shows":
      case "podcast":
      case "podcasts": {
        const res = await searchShows(q, limit);
        return NextResponse.json({ ok: true, type: "show", q, limit, data: res.data || [], total: res.total });
      }
      case "episode":
      case "episodes": {
        const res = await searchEpisodes(q, limit);
        return NextResponse.json({ ok: true, type: "episode", q, limit, data: res.data || [], total: res.total });
      }
      case "all": {
        const combined = await searchAll(q, Math.min(limit, 10));
        return NextResponse.json({ ok: true, type: "all", q, limit: Math.min(limit, 10), ...combined });
      }
      default:
        return NextResponse.json({ error: "invalid type" }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to search Deezer" }, { status: 500 });
  }
}
