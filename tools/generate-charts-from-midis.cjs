#!/usr/bin/env node
/**
 * Generate per-stem/per-difficulty StemStation charts from stem MIDIs.
 *
 * Input: app/stemstation/midi/*.mid
 *   Expected names: <safeId>_<stem>.mid (stem = drums|bass|other|vocals|melody) or <safeId>.mid
 * Output: app/stemstation/charts/<safeId>_<stem>_<difficulty>.json
 *
 * Difficulty tuning:
 *   - Quantize to 16th grid (uses MIDI tempo if present; otherwise 120 BPM)
 *   - Per-difficulty min gap and drop rates to keep Easy/Medium lighter.
 */

const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

const MIDI_DIR = path.join(process.cwd(), "app", "stemstation", "midi");
const CHART_DIR = path.join(process.cwd(), "app", "stemstation", "charts");

const MIN_GAP = { easy: 380, medium: 260, hard: 170, expert: 90 };
const DROP = { easy: 0.5, medium: 0.35, hard: 0.15, expert: 0 };

function quantize(ms, bpm, division = 4) {
  if (!bpm || bpm <= 0) return ms;
  const beatMs = 60000 / bpm;
  const grid = beatMs / division;
  return Math.round(ms / grid) * grid;
}

function mapLane(stem, pitch, idx) {
  if (stem === "drums") return pitch < 60 ? 0 : 1;
  if (stem === "bass") return 0;
  if (stem === "melody") return 2 + (idx % 2);
  if (stem === "vocals") return 2 + (idx % 2);
  return idx % 4;
}

function safeIdFrom(name) {
  return name.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function processMidi(file) {
  const baseName = path.basename(file, ".mid");
  const stemMatch = baseName.match(/(.+)_((drums)|(bass)|(other)|(vocals)|(melody))$/);
  const hasStem = !!stemMatch;
  const baseId = hasStem ? stemMatch[1] : baseName;
  const stem = hasStem ? stemMatch[2] : "melody";

  const data = fs.readFileSync(path.join(MIDI_DIR, file));
  const midi = new Midi(data);
  const bpm = midi.header.tempos[0]?.bpm || 120;
  const rawNotes = [];
  let idx = 0;

  midi.tracks.forEach((tr) => {
    tr.notes.forEach((n) => {
      const timeMs = quantize(n.time * 1000, bpm, 4);
      const durMs = Math.max(0, quantize(n.duration * 1000, bpm, 4));
      const lane = mapLane(stem, n.midi ?? 60, idx++);
      rawNotes.push({
        timeMs,
        endTimeMs: timeMs + durMs,
        durationMs: durMs,
        lane,
        type: durMs > 0 ? "hold" : "tap",
      });
    });
  });

  rawNotes.sort((a, b) => a.timeMs - b.timeMs);

  ["easy", "medium", "hard", "expert"].forEach((diff) => {
    const minGap = MIN_GAP[diff];
    const drop = DROP[diff];
    const lastLane = {};
    const notes = [];
    rawNotes.forEach((n) => {
      const last = lastLane[n.lane] ?? -Infinity;
      if (n.timeMs - last < minGap && diff !== "expert") return;
      if (drop > 0 && Math.random() < drop) return;
      lastLane[n.lane] = n.timeMs;
      notes.push(n);
    });

    const out = {
      songId: baseId,
      title: baseId,
      artist: "STEMSTATION",
      bpm,
      offsetMs: 0,
      difficulty: diff,
      notes,
    };
    const outPath = path.join(CHART_DIR, `${safeIdFrom(baseId)}_${stem}_${diff}.json`);
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log(`Chart ${outPath} notes=${notes.length}`);
  });
}

function main() {
  fs.mkdirSync(CHART_DIR, { recursive: true });
  const files = fs.readdirSync(MIDI_DIR).filter((f) => f.endsWith(".mid"));
  files.forEach(processMidi);
  console.log("Done generating charts from stem MIDIs.");
}

main();
