#!/usr/bin/env node
/**
 * Convert separated stems (Demucs output) to per-stem MIDIs.
 * Looks under app/stemstation/stems/mdx_extra/<songId>/{drums,bass,other,vocals}.wav
 * Writes MIDIs to app/stemstation/midi/<songId>_<stem>.mid
 */

const fs = require("fs");
const path = require("path");
const { Midi } = require("@tonejs/midi");

const stemsRoot = process.argv[2] || path.join(process.cwd(), "app", "stemstation", "stems", "mdx_extra");
const midiOutDir = path.join(process.cwd(), "app", "stemstation", "midi");
fs.mkdirSync(midiOutDir, { recursive: true });

function detectOnsets(wavPath) {
  const raw = fs.readFileSync(wavPath);
  const samples = [];
  for (let i = 44; i + 2 <= raw.length; i += 2) samples.push(raw.readInt16LE(i));
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
      onsets.push((i * hop) / 44100);
    }
  }
  return onsets;
}

function midiForStem(stem, onsets) {
  const midi = new Midi();
  const tr = midi.addTrack();
  const base = stem === "drums" ? 36 : stem === "vocals" ? 60 : 64;
  onsets.forEach((t, idx) => {
    tr.addNote({ midi: base + (idx % 4), time: t, duration: 0.2, velocity: 0.9 });
  });
  return midi;
}

function processSong(songDir) {
  const songId = path.basename(songDir);
  ["drums", "bass", "other", "vocals"].forEach((stem) => {
    const wavPath = path.join(songDir, `${stem}.wav`);
    if (!fs.existsSync(wavPath)) return;
    const onsets = detectOnsets(wavPath);
    const midi = midiForStem(stem, onsets);
    const out = path.join(midiOutDir, `${songId}_${stem}.mid`);
    fs.writeFileSync(out, Buffer.from(midi.toArray()));
    console.log(`Wrote ${out} (onsets=${onsets.length})`);
  });
}

fs.readdirSync(stemsRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .forEach((dirent) => processSong(path.join(stemsRoot, dirent.name)));

console.log("Done.");
