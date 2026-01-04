import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

type TrackRow = {
  id: string;
  title: string;
  artist: string;
  cover: string;
  bpm: number;
  difficulty: string;
  duration: number;
  audioUrl: string | null;
  chartSeed: number;
  productId?: string | null;
  tapGamePrice?: number | null;
};

type Payload = {
  album: {
    id: string;
    title: string;
    cover: string;
    artist: string;
  } | null;
  tracks: TrackRow[];
};

const DEFAULT_AUDIO_DURATION_MS = Number(
  process.env.TAPGAME_DEFAULT_DURATION_MS || 210_000,
);
const COVER_FALLBACK = "/branding/cropped_tap_logo.png";

export async function GET() {
  try {
    const payload = await buildLocalStemstationPayload();
    if (!payload) {
      return NextResponse.json(
        { album: null, tracks: [], error: "No local STEMSTATION tracks found" },
        { status: 200 },
      );
    }
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("STEMSTATION local track listing failed", error);
    return NextResponse.json(
      { album: null, tracks: [], error: "Failed to enumerate local STEMSTATION tracks" },
      { status: 500 },
    );
  }
}

async function buildLocalStemstationPayload(): Promise<Payload | null> {
  const baseDir = path.join(
    process.cwd(),
    "app",
    "stemstation",
    "Music For The Future -vx9",
  );

  let entries;
  try {
    entries = await fs.readdir(baseDir, { withFileTypes: true });
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      console.warn("STEMSTATION library missing at", baseDir);
      return null;
    }
    throw error;
  }
  const files = entries.filter(
    (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".mp3"),
  );

  if (!files.length) return null;

  const album = {
    id: "local:stemstation",
    title: "Music For The Future -vx9",
    cover: COVER_FALLBACK,
    artist: "STEMSTATION",
  };

  const tracks: TrackRow[] = files.map((file, idx) => {
    const title = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();

    const durationSeconds = Math.round(DEFAULT_AUDIO_DURATION_MS / 1000);

    const bpm = 110 + ((idx * 13) % 40);
    const difficulty =
      bpm >= 160 ? "Expert" : bpm >= 140 ? "Hard" : bpm >= 120 ? "Medium" : "Easy";

    const id = `local:${idx}:${file.name}`;

    return {
      id,
      title: title || `Stem ${idx + 1}`,
      artist: album.artist,
      cover: album.cover,
      bpm,
      difficulty,
      duration: durationSeconds,
      audioUrl: `/api/tapgame/stream?file=${encodeURIComponent(file.name)}`,
      productId: null,
      tapGamePrice: null,
      chartSeed: Math.abs(
        Array.from(id).reduce(
          (acc, ch) => (acc << 5) - acc + ch.charCodeAt(0),
          0,
        ),
      ),
    };
  });

  return { album, tracks };
}
