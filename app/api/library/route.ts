import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { DEFAULT_ALBUM_LOCAL_DIR, DEFAULT_ALBUM_NAME } from "@/lib/defaultAlbumConfig";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const defaultAlbum = loadDefaultAlbum();

  const payload = buildLibraryPayload(defaultAlbum);
  return NextResponse.json(payload);
}

function loadDefaultAlbum() {
  try {
    const baseDir = path.isAbsolute(DEFAULT_ALBUM_LOCAL_DIR)
      ? DEFAULT_ALBUM_LOCAL_DIR
      : path.join(process.cwd(), DEFAULT_ALBUM_LOCAL_DIR);

    const stat = fs.existsSync(baseDir) ? fs.statSync(baseDir) : null;
    if (!stat || !stat.isDirectory()) return null;

    const entries = fs.readdirSync(baseDir);
    const tracks = entries.filter((f) => f.toLowerCase().endsWith(".mp3"));
    const cover = entries.find((f) => /\.(png|jpe?g)$/i.test(f));
    const albumSlug = path.basename(baseDir);
    const assetBase = `/api/library/albums/${encodeURIComponent(albumSlug)}`;

    return {
      id: "default-album-mftf",
      purchasedAt: new Date(0).toISOString(),
      amountCents: 0,
      product: {
        id: "default-album-mftf",
        title: DEFAULT_ALBUM_NAME,
        priceCents: 0,
        coverArt: cover ? `${assetBase}/${encodeURIComponent(cover)}` : null,
        desc: "Pre-seeded album available to every user.",
        createdAt: new Date(0).toISOString(),
      },
      tracks: tracks.map((name, idx) => ({
        id: `default-track-${idx}`,
        title: name.replace(/\.mp3$/i, ""),
        audioUrl: `${assetBase}/${encodeURIComponent(name)}`,
      })),
    };
  } catch (err) {
    console.error("Failed to load default album", err);
    return null;
  }
}

function buildLibraryPayload(defaultAlbum: any) {
  if (!defaultAlbum) {
    return {
      tracks: [],
      albums: [],
      artists: [],
      playlists: [],
      posters: [],
      trades: [],
      recommendations: [],
      pass: undefined,
    };
  }

  const cover = defaultAlbum.product.coverArt || "/branding/cropped_tap_logo.png";
  const albumId = defaultAlbum.product.id;
  const artistName = "VX9";

  const tracks = (defaultAlbum.tracks || []).map((t: any, idx: number) => ({
    id: t.id || `default-track-${idx}`,
    title: t.title || `Track ${idx + 1}`,
    artist: artistName,
    album: defaultAlbum.product.title || DEFAULT_ALBUM_NAME,
    duration: t.duration || 180,
    cover: cover,
    audioUrl: t.audioUrl || null,
    saved: true,
    createdAt: new Date().toISOString(),
  }));

  return {
    tracks,
    albums: [
      {
        id: albumId,
        title: defaultAlbum.product.title || DEFAULT_ALBUM_NAME,
        artist: artistName,
        cover,
        tracks: tracks.length,
        releaseDate: new Date().toISOString(),
      },
    ],
    artists: [
      {
        id: "default-artist-vx9",
        name: artistName,
        avatar: cover,
        tracks: tracks.length,
        followers: 0,
      },
    ],
    playlists: [],
    posters: [],
    trades: [],
    recommendations: tracks.slice(0, 3),
    pass: undefined,
  };
}
