#!/usr/bin/env ts-node
/**
 * Generate Stemstation charts for local STEMSTATION songs using the internal generator.
 * Creates JSON charts in app/stemstation/charts for each local file and difficulty.
 *
 * Usage: pnpm dlx tsx tools/generate-local-charts.ts
 */
import fs from "fs";
import path from "path";

type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";
type GameNote = {
  id: string;
  lane: number;
  timeMs: number;
  type: "tap" | "hold";
  holdDuration?: number;
};

const MUSIC_DIR = path.join(process.cwd(), "app", "stemstation", "Music For The Future -vx9");
const CHARTS_DIR = path.join(process.cwd(), "app", "stemstation", "charts");
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

const LANE_HEIGHT = 600;
const NOTE_SPEED = 0.4;
const NOTE_TRAVEL_MS = LANE_HEIGHT / NOTE_SPEED;

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function buildChart(trackId: string, bpm: number, duration: number | undefined, chartSeed: number, difficulty: Difficulty): GameNote[] {
  const durationMs = Math.max(30_000, Math.min((duration ?? 180) * 1000, 120_000));
  const rand = seededRandom(chartSeed + difficulty.length * 137);

  const beatMs = 60000 / Math.max(60, bpm);
  const startAt = NOTE_TRAVEL_MS;
  const beatsPerBar = 4;
  const totalBeats = Math.max(8, Math.floor(durationMs / beatMs));
  const totalBars = Math.ceil(totalBeats / beatsPerBar);

  const densityByDiff = { Easy: 0.35, Medium: 0.55, Hard: 0.8, Expert: 1.0 } as const;
  const holdChanceByDiff = { Easy: 0.03, Medium: 0.08, Hard: 0.14, Expert: 0.22 } as const;
  const patternBank: Array<{ beats: number[]; lanes: number[] }> = [
    { beats: [0, 2], lanes: [0, 3] },
    { beats: [0, 1.5, 2, 3.5], lanes: [1, 2, 1, 3] },
    { beats: [0, 1, 2, 3], lanes: [0, 1, 2, 3] },
    { beats: [0, 0.5, 1, 2.5, 3], lanes: [2, 1, 3, 1, 2] },
    { beats: [0, 1.25, 2.5, 3.25], lanes: [3, 0, 2, 1] },
  ];

  const notes: GameNote[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const pattern = patternBank[(chartSeed + bar) % patternBank.length];
    const barOffsetBeats = bar * beatsPerBar;
    const density = densityByDiff[difficulty];
    pattern.beats.forEach((beat, idx) => {
      if (rand() > density) return;
      const lane = pattern.lanes[idx % pattern.lanes.length];
      const timeMs = Math.round(startAt + (barOffsetBeats + beat) * beatMs);
      const isHold = rand() < holdChanceByDiff[difficulty];
      const holdDuration = isHold ? beatMs * (difficulty === "Expert" ? 3 : 2) : undefined;
      notes.push({
        id: `${trackId}-${difficulty}-${bar}-${idx}`,
        lane,
        timeMs,
        type: isHold ? "hold" : "tap",
        holdDuration,
      });
    });
    if (difficulty === "Hard" || difficulty === "Expert") {
      const chordTime = Math.round(startAt + barOffsetBeats * beatMs);
      if (rand() < 0.5) {
        notes.push(
          { id: `${trackId}-${difficulty}-${bar}-ch0`, lane: 0, timeMs: chordTime, type: "tap" },
          { id: `${trackId}-${difficulty}-${bar}-ch3`, lane: 3, timeMs: chordTime, type: "tap" },
        );
      }
    }
  }

  if (notes.length < 8) {
    const fallbackSpacing = Math.max(beatMs * 2, 400);
    for (let i = 0; i < 8; i++) {
      notes.push({
        id: `${trackId}-${difficulty}-fallback-${i}`,
        lane: i % 4,
        timeMs: Math.round(startAt + i * fallbackSpacing),
        type: "tap",
      });
    }
  }

  return notes.sort((a, b) => a.timeMs - b.timeMs);
}

function sanitizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

async function main() {
  const entries = fs.readdirSync(MUSIC_DIR, { withFileTypes: true });
  const files = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".mp3"));
  if (!files.length) {
    console.error("No local STEMSTATION MP3s found at", MUSIC_DIR);
    process.exit(1);
  }
  fs.mkdirSync(CHARTS_DIR, { recursive: true });

  files.forEach((file, idx) => {
    const title = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
    const bpm = 110 + ((idx * 13) % 40);
    const durationSeconds = 210; // fallback duration
    const trackId = `local:${idx}:${file.name}`;
    const safeId = sanitizeId(trackId);
    const chartSeed = Math.abs(Array.from(trackId).reduce((acc, ch) => (acc << 5) - acc + ch.charCodeAt(0), 0));

    const outPath = path.join(CHARTS_DIR, `${safeId}.json`);
    const chart = {
      songId: trackId,
      title: title || `Stem ${idx + 1}`,
      artist: "STEMSTATION",
      bpm,
      offsetMs: 0,
      difficulty: "all",
      notes: [] as GameNote[],
    };

    DIFFICULTIES.forEach((diff) => {
      chart.notes.push(...buildChart(trackId, bpm, durationSeconds, chartSeed, diff));
    });

    fs.writeFileSync(outPath, JSON.stringify(chart, null, 2));
    console.log(`Chart written: ${outPath} (${chart.notes.length} notes across difficulties)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
