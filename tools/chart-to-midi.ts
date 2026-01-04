#!/usr/bin/env ts-node
/**
 * Convert a Stemstation chart JSON into a MIDI file for DAW preview.
 *
 * Usage:
 *   pnpm dlx tsx tools/chart-to-midi.ts <trackId> [outDir]
 *
 * Expects chart at app/stemstation/charts/<trackId>.json (sanitized fallback is handled in the API, but here you pass the filename without .json).
 */
import fs from "fs";
import path from "path";
import MidiPkg from "@tonejs/midi";
const { Midi } = MidiPkg as any;

type ChartNote = {
  timeMs: number;
  lane: number;
  type?: "tap" | "hold" | string;
  endTimeMs?: number;
  holdDuration?: number;
};

const trackId = process.argv[2];
const outDirArg = process.argv[3];

if (!trackId) {
  console.error("Usage: pnpm dlx tsx tools/chart-to-midi.ts <trackId> [outDir]");
  process.exit(1);
}

const chartsDir = path.join(process.cwd(), "app", "stemstation", "charts");
const chartPath = path.join(chartsDir, `${trackId}.json`);
const outDir = outDirArg ? path.resolve(outDirArg) : path.join(process.cwd(), "app", "stemstation", "midi");

function laneToMidi(lane: number) {
  // Map lanes 0-3 to a comfortable C-minor-ish range; tweak as desired.
  const table = [48, 52, 55, 60]; // C3, E3, G3, C4
  return table[Math.max(0, Math.min(3, lane))];
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function loadChart() {
  const data = JSON.parse(fs.readFileSync(chartPath, "utf-8"));
  const notes: ChartNote[] = Array.isArray(data?.notes) ? data.notes : [];
  if (!notes.length) throw new Error("Chart has no notes");
  const bpm = Number(data?.bpm || 120);
  const offsetMs = Number(data?.offsetMs || 0);
  return { data, notes, bpm, offsetMs };
}

function main() {
  const { data, notes, bpm, offsetMs } = loadChart();
  const midi = new Midi();
  midi.header.setTempo(bpm);
  const track = midi.addTrack();

  notes.forEach((n, idx) => {
    const timeMs = Number(n.timeMs ?? 0) + offsetMs;
    const startSeconds = Math.max(0, timeMs) / 1000;
    const endMs = typeof n.endTimeMs === "number"
      ? n.endTimeMs
      : typeof n.holdDuration === "number"
      ? timeMs + Number(n.holdDuration)
      : timeMs + 200; // short default
    const endSeconds = Math.max(startSeconds + 0.05, endMs / 1000);
    const durationSeconds = Math.max(0.05, endSeconds - startSeconds);
    const midiNote = laneToMidi(n.lane ?? 0);
    track.addNote({
      midi: midiNote,
      time: startSeconds,
      duration: durationSeconds,
      velocity: 0.8,
      noteOffVelocity: 0.8,
    });
  });

  ensureDir(outDir);
  const outPath = path.join(outDir, `${trackId}.mid`);
  fs.writeFileSync(outPath, Buffer.from(midi.toArray()));
  console.log(`MIDI written: ${outPath} (bpm=${bpm}, notes=${notes.length})`);
}

main();
