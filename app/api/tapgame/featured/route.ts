import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  DEFAULT_ALBUM_ARTIST,
  DEFAULT_ALBUM_BUCKET,
  DEFAULT_ALBUM_NAME,
  DEFAULT_ALBUM_STORAGE_DASHBOARD_URL,
} from "@/lib/defaultAlbumConfig";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

const DEFAULT_AUDIO_DURATION_MS = Number(process.env.TAPGAME_DEFAULT_DURATION_MS || 210_000);
const COVER_FALLBACK = "/branding/cropped_tap_logo.png";

type SupabaseTrack = {
  id: string;
  title?: string;
  artistId?: string;
  albumId?: string;
  coverUrl?: string;
  audioUrl?: string;
  durationMs?: number;
  meta?: any;
};

type TapGameProduct = {
  id: string;
  priceCents?: number | null;
  desc?: string | null;
};

type FeaturedPayload = {
  album: {
    id: string;
    title: string;
    cover: string;
    artist: string;
  } | null;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    cover: string;
    bpm: number;
    difficulty: string;
    duration: number;
    audioUrl: string | null;
    productId?: string | null;
    tapGamePrice?: number | null;
    chartSeed: number;
  }>;
};

export async function GET() {
  if (!supabaseAdmin) {
    // If Supabase is not configured at all, fall back to the local STEMSTATION
    // library so the game still works in offline / local mode.
    const fallback = await buildLocalStemstationPayload();
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  console.debug?.("Default album bucket dashboard:", DEFAULT_ALBUM_STORAGE_DASHBOARD_URL);

  try {
    const albumResp = await supabaseAdmin
      .from("Album")
      .select("id,title,coverUrl,artist")
      .ilike("title", `%${DEFAULT_ALBUM_NAME}%`)
      .order("createdAt", { ascending: false })
      .limit(1);

    if (albumResp.error) {
      // Common local-dev error: the table public.album does not exist in the
      // Supabase schema cache. In that case, skip DB entirely and serve the
      // local STEMSTATION library instead of failing the whole endpoint.
      if (isMissingTableError(albumResp.error)) {
        const fallback = await buildLocalStemstationPayload();
        if (fallback) {
          return NextResponse.json(fallback);
        }
      }
      throw albumResp.error;
    }
    const album = albumResp.data?.[0] ?? null;
    let trackResp;
    if (album?.id) {
      trackResp = await supabaseAdmin
        .from("Track")
        .select("id,title,artistId,albumId,coverUrl,audioUrl,durationMs,meta")
        .eq("albumId", album.id)
        .order("createdAt", { ascending: true });
      if (trackResp.error) throw trackResp.error;
    }

    if (!trackResp?.data?.length) {
      const fallback = await fetchDefaultBucketTracks(album);
      if (fallback.length) {
        return NextResponse.json({
          album: formatAlbum(
            album ?? {
              id: `bucket:${DEFAULT_ALBUM_BUCKET}`,
              title: DEFAULT_ALBUM_NAME,
              coverUrl: album?.coverUrl ?? COVER_FALLBACK,
              artist: album?.artist ?? DEFAULT_ALBUM_ARTIST,
            }
          ),
          // When there are no DB tracks yet, hydrate from the default bucket
          // using only the bucket metadata; product/artist maps are not needed.
          tracks: fallback.map((track) => mapTrackPayload(track, album)),
        });
      }

      trackResp = await supabaseAdmin
        .from("Track")
        .select("id,title,artistId,albumId,coverUrl,audioUrl,durationMs,meta")
        .order("createdAt", { ascending: false })
        .limit(12);
      if (trackResp.error) throw trackResp.error;
    }

    const tracks = (trackResp.data || []).slice(0, 8);
    if (!tracks.length) {
      return NextResponse.json({ album: album ? formatAlbum(album) : null, tracks: [] });
    }

    const artistIds = Array.from(new Set(tracks.map((t: SupabaseTrack) => t.artistId).filter(Boolean as any)));
    const artistMap = new Map<string, string>();
    if (artistIds.length) {
      const artistResp = await supabaseAdmin
        .from("Artist")
        .select("id,stageName")
        .in("id", artistIds);
      if (!artistResp.error && artistResp.data) {
        artistResp.data.forEach((artist: any) => artistMap.set(artist.id, artist.stageName));
      }
    }

    const productResp = await supabaseAdmin
      .from("Product")
      .select("id,priceCents,desc")
      .ilike("desc", "%tapgame:%");
    if (productResp.error) throw productResp.error;
    const productMap = new Map<string, TapGameProduct>();
    const tagRegex = /tapgame:([0-9a-f-]+)/i;
    (productResp.data || []).forEach((product: TapGameProduct) => {
      const match = (product.desc || "").match(tagRegex);
      if (match) {
        productMap.set(match[1], product);
      }
    });

    const payload = tracks.map((track: SupabaseTrack) => mapTrackPayload(track, album, artistMap, productMap));

    return NextResponse.json({
      album: album ? formatAlbum(album) : null,
      tracks: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to build TapGame playlist" }, { status: 500 });
  }
}

function formatAlbum(album: any) {
  return {
    id: album.id,
    title: album.title ?? DEFAULT_ALBUM_NAME,
    cover: album.coverUrl ?? COVER_FALLBACK,
    artist: album.artist ?? DEFAULT_ALBUM_ARTIST,
  };
}

function mapTrackPayload(
  track: SupabaseTrack,
  album?: any,
  artistMap?: Map<string, string>,
  productMap?: Map<string, TapGameProduct>
) {
  const meta = typeof track.meta === "object" && track.meta !== null ? track.meta : {};
  const bpm = computeBpm(track);
  const difficulty = computeDifficulty(track, bpm);
  const product = productMap?.get(track.id);
  return {
    id: track.id,
    title: track.title ?? "Untitled",
    artist: artistMap?.get(track.artistId ?? "") ?? meta.tapGame?.artist ?? "TapGame Creator",
    cover: track.coverUrl ?? album?.coverUrl ?? COVER_FALLBACK,
    bpm,
    difficulty,
    duration: track.durationMs ? Math.round(track.durationMs / 1000) : 0,
    audioUrl: track.audioUrl ?? null,
    productId: product?.id ?? null,
    tapGamePrice: product?.priceCents ?? null,
    chartSeed: computeChartSeed(track),
  };
}

async function fetchDefaultBucketTracks(album?: any): Promise<SupabaseTrack[]> {
  if (!supabaseAdmin || !DEFAULT_ALBUM_BUCKET) return [];
  try {
    const listing = await supabaseAdmin.storage.from(DEFAULT_ALBUM_BUCKET).list("", { limit: 64 });
    if (listing.error || !listing.data?.length) return [];
    const files = listing.data.filter((file: any) => file.name.toLowerCase().endsWith(".mp3"));
    return files.map((file: any, idx: number) => {
      const { data: urlData } = supabaseAdmin.storage.from(DEFAULT_ALBUM_BUCKET).getPublicUrl(file.name);
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
      return {
        id: file.id || `${DEFAULT_ALBUM_BUCKET}/${file.name}`,
        title: title || `Music For The Future ${idx + 1}`,
        artistId: null,
        albumId: album?.id ?? null,
        coverUrl: album?.coverUrl ?? COVER_FALLBACK,
        audioUrl: urlData?.publicUrl ?? null,
        durationMs: DEFAULT_AUDIO_DURATION_MS,
        meta: {
          tapGame: {
            bpm: 110 + ((idx * 13) % 40),
            difficulty: ["Easy", "Medium", "Hard", "Expert"][idx % 4],
          },
        },
      };
    });
  } catch (error) {
    console.error("tapgame bucket fallback failed", error);
    return [];
  }
}

function computeBpm(track: SupabaseTrack): number {
  const meta = typeof track.meta === "object" ? track.meta : {};
  if (meta?.tapGame?.bpm) {
    return Number(meta.tapGame.bpm) || 128;
  }
  const letters = `${track.title ?? ""}`.split("");
  const seed = letters.reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return 100 + (seed % 90);
}

function computeDifficulty(track: SupabaseTrack, bpm: number): string {
  const meta = typeof track.meta === "object" ? track.meta : {};
  if (meta?.tapGame?.difficulty) return meta.tapGame.difficulty;
  if (bpm >= 160) return "Expert";
  if (bpm >= 140) return "Hard";
  if (bpm >= 120) return "Medium";
  return "Easy";
}

function computeChartSeed(track: SupabaseTrack): number {
  if (typeof track.meta === "object" && track.meta?.tapGame?.chartSeed) {
    return Number(track.meta.tapGame.chartSeed) || 0;
  }
  const basis = `${track.id}:${track.title ?? ""}:${track.durationMs ?? 0}`;
  let hash = 0;
  for (let i = 0; i < basis.length; i++) {
    hash = (hash << 5) - hash + basis.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function isMissingTableError(error: any): boolean {
  const code = error?.code;
  const message = String(error?.message || "").toLowerCase();
  const details = String(error?.details || "").toLowerCase();
  // Supabase / PostgREST usually reports missing tables with code PGRST201 and
  // a "does not exist in schema cache" message.
  if (code === "PGRST201") return true;
  if (message.includes("does not exist in schema cache")) return true;
  if (details.includes("does not exist in schema cache")) return true;
  return false;
}

async function buildLocalStemstationPayload(): Promise<FeaturedPayload | null> {
  // Local default library path for STEMSTATION game.
  const baseDir = path.join(
    process.cwd(),
    "app",
    "stemstation",
    "Music For The Future -vx9"
  );

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const files = entries.filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".mp3")
    );

    if (!files.length) {
      return null;
    }

    const album = {
      id: "local:stemstation",
      title: DEFAULT_ALBUM_NAME || "Music For The Future -vx9",
      cover: COVER_FALLBACK,
      artist: DEFAULT_ALBUM_ARTIST || "STEMSTATION",
    };

    const tracks = files.map((file, idx) => {
      const title = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();

      const durationSeconds = Math.round(
        Number(process.env.TAPGAME_DEFAULT_DURATION_MS || DEFAULT_AUDIO_DURATION_MS) / 1000
      );

      // Use a simple deterministic BPM / difficulty seed based on index.
      const bpm = 110 + ((idx * 13) % 40);
      const difficulty =
        bpm >= 160
          ? "Expert"
          : bpm >= 140
          ? "Hard"
          : bpm >= 120
          ? "Medium"
          : "Easy";

      const id = `local:${idx}:${file.name}`;

      return {
        id,
        title: title || `Stem ${idx + 1}`,
        artist: album.artist,
        cover: album.cover,
        bpm,
        difficulty,
        duration: durationSeconds,
        // Streamed via dedicated API route backed by local filesystem
        audioUrl: `/api/tapgame/stream?file=${encodeURIComponent(
          file.name
        )}`,
        productId: null,
        tapGamePrice: null,
        chartSeed: Math.abs(
          Array.from(id).reduce((acc, ch) => (acc << 5) - acc + ch.charCodeAt(0), 0)
        ),
      };
    });

    return { album, tracks };
  } catch (error) {
    console.error("Failed to build local STEMSTATION payload", error);
    return null;
  }
}
