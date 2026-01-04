#!/usr/bin/env node
/**
 * Lightweight onset-based audio -> MIDI + Stemstation chart generator (no TensorFlow).
 *
 * Usage:
 *   node tools/onset-to-midi.cjs <audioPath|dir> <trackIdOrDirName> <difficulty> [offsetMs]
 *
 * If the first arg is a directory, it will process all *.mp3 files inside and
 * use trackId="local:<index>:<filename>" for each.
 *
 * Outputs:
 *   - app/stemstation/midi/<sanitized-trackId>.mid
 *   - app/stemstation/charts/<sanitized-trackId>.json
 *
 * Dependencies: ffmpeg installed; music-metadata (already in repo). Uses basic amplitude peaks;
 * this is a fallback when basic-pitch/TF isn't available.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const MidiPkg = require("@tonejs/midi");
const { Midi } = MidiPkg;
const { parseFile } = require("music-metadata");

const inputPath = process.argv[2];
const trackArg = process.argv[3];
const diffArg = (process.argv[4] || "normal").toLowerCase();
const offsetMs = Number(process.argv[5] || 0);

const DIFFS = ["easy", "normal", "hard", "expert"];
if (!inputPath || !trackArg) {
  console.error("Usage: node tools/onset-to-midi.cjs <audioPath|dir> <trackIdOrDirName> <difficulty> [offsetMs]");
  process.exit(1);
}
if (!DIFFS.includes(diffArg)) {
  console.error("Difficulty must be one of:", DIFFS.join(", "));
  process.exit(1);
}

const LANE_HEIGHT = 600;
const NOTE_SPEED = 0.4;
const NOTE_TRAVEL_MS = LANE_HEIGHT / NOTE_SPEED;

function sanitize(id) {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "_");
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function laneFor(idx) {
  return idx % 4;
}
function decodeToMonoWav(input, out) {
  const r = spawnSync("ffmpeg", ["-y", "-i", input, "-ac", "1", "-ar", "44100", out], { stdio: "ignore" });
  if (r.status !== 0) {
    throw new Error("ffmpeg decode failed");
  }
}
async function detectOnsets(wavPath, durationSec) {
  const raw = fs.readFileSync(wavPath);
  const samples = [];
  for (let i = 44; i + 2 <= raw.length; i += 2) {
    samples.push(raw.readInt16LE(i));
  }
  const hop = 1024;
  const peaks = [];
  for (let i = 0; i < samples.length - hop; i += hop) {
    let energy = 0;
    for (let j = 0; j < hop; j++) energy += Math.abs(samples[i + j]);
    peaks.push(energy / hop);
  }
  const onsets = [];
  for (let i = 1; i < peaks.length - 1; i++) {
    if (peaks[i] > peaks[i - 1] && peaks[i] > peaks[i + 1] && peaks[i] > 2000) {
      const timeSec = (i * hop) / 44100;
      onsets.push(timeSec);
    }
  }
  return onsets.filter((t) => t >= 0 && t <= durationSec);
}

function buildChart(onsets, difficulty, offsetMs) {
  const density = { easy: 0.35, normal: 0.55, hard: 0.75, expert: 0.9 }[difficulty];
  return onsets
    .filter(() => Math.random() <= density)
    .map((t, idx) => ({
      timeMs: Math.round(t * 1000) + offsetMs + NOTE_TRAVEL_MS,
      lane: laneFor(idx),
      type: "tap",
    }));
}

async function processFile(audioFile, trackId, difficulty, offsetMs) {
  const sanitized = sanitize(trackId);
  const chartsDir = path.join(process.cwd(), "app", "stemstation", "charts");
  const midiDir = path.join(process.cwd(), "app", "stemstation", "midi");
  ensureDir(chartsDir);
  ensureDir(midiDir);

  const tmpWav = path.join(process.cwd(), "app", "stemstation", "tmp_onset.wav");
  decodeToMonoWav(audioFile, tmpWav);
  const meta = await parseFile(tmpWav);
  const durationSec = meta.format.duration || 0;
  const bpm = meta.common.bpm || null;
  const onsets = await detectOnsets(tmpWav, durationSec);
  fs.unlinkSync(tmpWav);

  const notes = buildChart(onsets, difficulty, offsetMs).sort((a, b) => a.timeMs - b.timeMs);

  const midi = new Midi();
  if (bpm) midi.header.setTempo(bpm);
  const tr = midi.addTrack();
  notes.forEach((n) => {
    tr.addNote({
      midi: 48 + n.lane * 5,
      time: Math.max(0, n.timeMs / 1000),
      duration: 0.2,
      velocity: 0.8,
    });
  });
  const midiOut = path.join(midiDir, `${sanitized}.mid`);
  fs.writeFileSync(midiOut, Buffer.from(midi.toArray()));

  const chart = {
    songId: trackId,
    title: path.basename(audioFile),
    artist: "STEMSTATION",
    bpm,
    offsetMs,
    difficulty,
    notes,
  };
  const chartOut = path.join(chartsDir, `${sanitized}.json`);
  fs.writeFileSync(chartOut, JSON.stringify(chart, null, 2));
  console.log(`Onset chart: ${chartOut} (notes=${notes.length})`);
  console.log(`MIDI: ${midiOut}`);
}

async function main() {
  const stats = fs.statSync(inputPath);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(inputPath).filter((f) => f.toLowerCase().endsWith(".mp3"));
    let idx = 0;
    for (const f of files) {
      const full = path.join(inputPath, f);
      const trackId = `local:${idx}:${f}`;
      console.log(`Processing ${full} -> ${trackId}`);
      await processFile(full, trackId, diffArg, offsetMs);
      idx++;
    }
  } else {
    await processFile(inputPath, trackArg, diffArg, offsetMs);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
