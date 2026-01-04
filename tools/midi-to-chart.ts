#!/usr/bin/env ts-node
/**
 * Convert a MIDI file into a Stemstation chart JSON.
 *
 * Usage:
 *   pnpm dlx tsx tools/midi-to-chart.ts <input.mid> <trackId> <difficulty> [offsetMs]
 *
 * Output:
 *   Writes app/stemstation/charts/<trackId>.json (merging if file exists by appending notes)
 */
import fs from "fs";
import path from "path";
import { Midi } from "@tonejs/midi";

type ChartNote = {
  timeMs: number;
  lane: number;
  type: "tap" | "hold";
  endTimeMs?: number;
};

const input = process.argv[2];
const trackId = process.argv[3];
const difficulty = (process.argv[4] || "normal").toLowerCase();
const offsetMs = Number(process.argv[5] || 0);

if (!input || !trackId) {
  console.error("Usage: pnpm dlx tsx tools/midi-to-chart.ts <input.mid> <trackId> <difficulty> [offsetMs]");
  process.exit(1);
}

const DIFFS = ["easy", "normal", "hard", "expert"];
if (!DIFFS.includes(difficulty)) {
  console.error(`Difficulty must be one of: ${DIFFS.join(", ")}`);
  process.exit(1);
}

function laneFor(midiNote: number) {
  // Map midi note to 4 lanes (0-3). Feel free to tweak to your stems.
  return Math.max(0, Math.min(3, Math.floor((midiNote - 36) / 12)));
}

function typeFor(duration: number) {
  // durations are in seconds; convert to ms threshold
  return duration * 1000 >= 350 ? "hold" : "tap";
}

async function main() {
  const data = fs.readFileSync(input);
  const midi = new Midi(data);
  const bpm = midi.header.tempos[0]?.bpm || 120;

  const notes: ChartNote[] = [];
  midi.tracks.forEach((t, trackIdx) => {
    t.notes.forEach((n, idx) => {
      const timeMs = Math.round(n.time * 1000) + offsetMs;
      const endMs = Math.round((n.time + n.duration) * 1000) + offsetMs;
      notes.push({
        timeMs,
        lane: laneFor(n.midi),
        type: typeFor(n.duration),
        endTimeMs: typeFor(n.duration) === "hold" ? endMs : undefined,
      });
    });
  });

  const sorted = notes
    .filter((n) => Number.isFinite(n.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);

  const out = {
    songId: trackId,
    title: path.basename(input),
    artist: "Unknown",
    bpm,
    offsetMs,
    difficulty,
    notes: sorted,
  };

  const chartsDir = path.join(process.cwd(), "app", "stemstation", "charts");
  fs.mkdirSync(chartsDir, { recursive: true });
  const outPath = path.join(chartsDir, `${trackId}.json`);
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Chart written: ${outPath} (${sorted.length} notes)`);
}

main().catch((err) => {
  console.error("Failed to convert MIDI:", err);
  process.exit(1);
});
