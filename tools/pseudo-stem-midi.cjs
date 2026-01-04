#!/usr/bin/env node
/**
 * Pseudo stem splitter + onset->MIDI generator (no ML).
 * Uses ffmpeg EQ bands to approximate stems (drums/melody/vocals) and writes per-stem MIDIs.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { Midi } = require("@tonejs/midi");

const INPUT = process.argv[2];
if (!INPUT) {
  console.error("Usage: node tools/pseudo-stem-midi.cjs <songFile|dir>");
  process.exit(1);
}

const MIDI_DIR = path.join(process.cwd(), "app", "stemstation", "midi");
const TMP_DIR = path.join(os.tmpdir(), "stemstation-stems");
fs.mkdirSync(MIDI_DIR, { recursive: true });
fs.mkdirSync(TMP_DIR, { recursive: true });

function sanitize(id) {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit" });
  if (res.status !== 0) throw new Error(`${cmd} failed`);
}

function decodeStem(input, out, filter) {
  const args = ["-y", "-i", input, "-vn", "-ac", "1", "-ar", "44100"];
  if (filter) args.push("-af", filter);
  args.push(out);
  run("ffmpeg", args);
}

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
      const timeSec = (i * hop) / 44100;
      onsets.push(timeSec);
    }
  }
  return onsets;
}

const STEM_FILTERS = {
  drums: "lowpass=f=200,highpass=f=30",
  melody: "highpass=f=400",
  vocals: "bandpass=f=2000:width_type=h:width=1.5",
};

function buildMidi(onsets, stem) {
  const midi = new Midi();
  const track = midi.addTrack();
  const base = stem === "drums" ? 36 : stem === "vocals" ? 60 : 64;
  onsets.forEach((t, idx) => {
    track.addNote({ midi: base + (idx % 4), time: t, duration: 0.2, velocity: 0.9 });
  });
  return midi;
}

function processFile(filePath) {
  const baseName = path.basename(filePath);
  const safeId = sanitize(baseName.replace(/\.[^/.]+$/, ""));
  for (const stem of Object.keys(STEM_FILTERS)) {
    const stemWav = path.join(TMP_DIR, `${safeId}_${stem}.wav`);
    decodeStem(filePath, stemWav, STEM_FILTERS[stem]);
    const onsets = detectOnsets(stemWav);
    const midi = buildMidi(onsets, stem);
    const outMid = path.join(MIDI_DIR, `${safeId}_${stem}.mid`);
    fs.writeFileSync(outMid, Buffer.from(midi.toArray()));
    console.log(`MIDI written: ${outMid} (onsets=${onsets.length})`);
    fs.unlinkSync(stemWav);
  }
}

function listFiles(input) {
  const stat = fs.statSync(input);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(input)
      .filter((f) => f.toLowerCase().endsWith(".mp3") || f.toLowerCase().endsWith(".wav"))
      .map((f) => path.join(input, f));
  }
  return [input];
}

try {
  const files = listFiles(INPUT);
  files.forEach(processFile);
  console.log("Done. MIDIs in app/stemstation/midi");
} catch (err) {
  console.error(err);
  process.exit(1);
}
