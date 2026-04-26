import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";

type RawNote = {
  timeMs: number;
  lane: number;
  type?: string;
  endTimeMs?: number;
  holdDuration?: number;
  durationMs?: number;
  pitch?: number;
};

type StemDifficulty = {
  notes?: RawNote[];
};

type StemBlock = {
  midiFile?: string | null;
  difficulties?: Record<string, StemDifficulty>;
};

type ChartFile = {
  songId?: string;
  trackId?: string;
  title?: string | null;
  songName?: string | null;
  artist?: string | null;
  bpm?: number | null;
  offsetMs?: number;
  audioOffsetMs?: number;
  difficulty?: string | null;
  notes?: RawNote[];
  stems?: Record<string, StemBlock>;
};

const STEM_ROOT = path.join(process.cwd(), "app", "stemstation");
const LIBRARY_DIR = path.join(STEM_ROOT, "Music For The Future -vx9");
const CHART_DIR = path.join(STEM_ROOT, "charts");
const MIDI_DIR = path.join(STEM_ROOT, "midi");
const NOTE_TRAVEL_MS = 1500; // matches client NOTE_TRAVEL_MS (600 / 0.4)
const DEFAULT_DURATION_MS = 180_000;
const MIN_GAP_BY_DIFF: Record<string, number> = {
  easy: 380,
  medium: 260,
  hard: 170,
  expert: 90,
};
const DROP_RATE_BY_DIFF: Record<string, number> = {
  easy: 0.5,
  medium: 0.35,
  hard: 0.15,
  expert: 0,
};

function sanitizeId(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

function normalizeName(name: string) {
  return name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]+/g, "").toLowerCase();
}

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

// Avoid rewriting JSON when the bytes already on disk are identical. Prewarm bursts
// can fire 5 stems × 4 difficulties = 20 GETs on song select; without this guard each
// one would queue an fs.writeFile and bump mtime even when content is unchanged.
async function writeIfChanged(target: string, contents: string): Promise<void> {
  try {
    const existing = await fs.readFile(target, "utf-8");
    if (existing === contents) return;
  } catch {
    // file missing — fall through to write
  }
  await fs.writeFile(target, contents, "utf-8");
}

async function loadExistingChart(trackId: string, stem?: string, difficulty?: string): Promise<ChartFile | null> {
  const safe = sanitizeId(trackId);
  const candidates = [
    stem && difficulty ? path.join(CHART_DIR, `${safe}_${stem}_${difficulty}.json`) : null,
    path.join(CHART_DIR, `${trackId}.json`),
    path.join(CHART_DIR, `${safe}.json`),
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (!shouldUseCandidate(candidate, stem, difficulty)) continue;
    try {
      const data = await fs.readFile(candidate, "utf-8");
      return JSON.parse(data);
    } catch (err: any) {
      if (err?.code === "ENOENT") continue;
      throw err;
    }
  }
  return null;
}

async function findAudioFile(trackId: string): Promise<string | null> {
  const maybeName = trackId.includes(":") ? trackId.split(":").slice(-1)[0] : trackId;

  const directPath = path.join(LIBRARY_DIR, maybeName);
  try {
    await fs.access(directPath);
    return directPath;
  } catch {
    // continue
  }

  try {
    const entries = await fs.readdir(LIBRARY_DIR);
    const target = normalizeName(maybeName);
    const match = entries.find((name) => normalizeName(name) === target);
    if (match) {
      return path.join(LIBRARY_DIR, match);
    }
  } catch {
    // ignore library read errors for now
  }

  return null;
}

async function readAudioMeta(audioPath: string): Promise<{
  durationMs: number | null;
  bpm: number | null;
  title: string | null;
  artist: string | null;
}> {
  try {
    const mm = await import("music-metadata");
    const meta = await mm.parseFile(audioPath);
    return {
      durationMs: meta.format.duration ? meta.format.duration * 1000 : null,
      bpm: meta.common.bpm ?? null,
      title: meta.common.title ?? null,
      artist: meta.common.artist ?? null,
    };
  } catch (err: any) {
    // Optional dependency; degrade gracefully.
    if (err?.code !== "ERR_MODULE_NOT_FOUND") {
      console.warn("STEMSTATION metadata read failed", err);
    }
    return { durationMs: null, bpm: null, title: null, artist: null };
  }
}

// Stem-shaped pattern banks. Each entry is a single-bar pattern (beats in [0,4)).
const STEM_PATTERNS: Record<string, Array<{ beats: number[]; lanes: number[] }>> = {
  drums: [
    { beats: [0, 1, 2, 3], lanes: [0, 1, 0, 1] },        // four-on-the-floor + snare
    { beats: [0, 1.5, 2, 3.5], lanes: [0, 2, 1, 2] },    // backbeat with hat
    { beats: [0, 0.5, 1, 2, 2.5, 3], lanes: [0, 2, 1, 0, 2, 1] },
  ],
  bass: [
    { beats: [0, 2], lanes: [0, 1] },
    { beats: [0, 1.5, 2, 3.5], lanes: [0, 1, 0, 1] },
    { beats: [0, 0.75, 2, 2.75], lanes: [0, 1, 1, 0] },
  ],
  melody: [
    { beats: [0, 1, 2, 3], lanes: [2, 3, 2, 3] },
    { beats: [0, 1.5, 2, 3.5], lanes: [2, 3, 1, 2] },
    { beats: [0, 0.5, 1, 2.5, 3], lanes: [3, 2, 1, 2, 3] },
  ],
  vocals: [
    { beats: [0, 2], lanes: [2, 3] },
    { beats: [0, 1.5, 3], lanes: [2, 3, 2] },
    { beats: [0.5, 2, 3.5], lanes: [3, 2, 3] },
  ],
  other: [
    { beats: [0, 1, 2, 3], lanes: [0, 1, 2, 3] },
    { beats: [0, 1.25, 2.5, 3.25], lanes: [3, 0, 2, 1] },
    { beats: [0, 0.5, 1, 2.5, 3], lanes: [2, 1, 3, 1, 2] },
  ],
};

function buildProceduralChart({
  trackId,
  stem,
  title,
  artist,
  bpm,
  durationMs,
  difficulty,
  offsetMs,
}: {
  trackId: string;
  stem: string;
  title?: string | null;
  artist?: string | null;
  bpm: number;
  durationMs: number;
  difficulty: string;
  offsetMs: number;
}): ChartFile {
  const diff = difficulty.toLowerCase();
  const stemLower = stem.toLowerCase();
  // Per-stem density tuning so drums feel busier than vocals at the same difficulty.
  const stemDensityScale: Record<string, number> = {
    drums: 1.1, bass: 0.9, melody: 1.0, vocals: 0.7, other: 1.0,
  };
  const densityMap: Record<string, number> = {
    easy: 0.18, medium: 0.45, hard: 0.75, expert: 1.0,
  };
  const holdChance: Record<string, number> = {
    easy: 0, medium: stemLower === "vocals" ? 0.18 : 0.05,
    hard: stemLower === "vocals" ? 0.32 : 0.14,
    expert: stemLower === "vocals" ? 0.45 : 0.22,
  };
  const beatMs = 60000 / Math.max(60, bpm || 120);
  const startAt = NOTE_TRAVEL_MS + offsetMs;
  const totalBeats = Math.max(8, Math.floor(durationMs / beatMs));
  const beatsPerBar = 4;
  const totalBars = Math.ceil(totalBeats / beatsPerBar);
  const seed = hashSeed(trackId, stemLower, diff);
  const rand = seededRandom(seed);
  const patterns = STEM_PATTERNS[stemLower] ?? STEM_PATTERNS.other;

  const notes: RawNote[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const pattern = patterns[(seed + bar) % patterns.length];
    const barOffsetBeats = bar * beatsPerBar;
    const density = (densityMap[diff] ?? 0.55) * (stemDensityScale[stemLower] ?? 1.0);
    pattern.beats.forEach((beat, idx) => {
      if (rand() > density) return;
      const lane = pattern.lanes[idx % pattern.lanes.length];
      const timeMs = Math.round(startAt + (barOffsetBeats + beat) * beatMs);
      const shouldHold = rand() < (holdChance[diff] ?? 0.1);
      const endTimeMs = shouldHold
        ? Math.round(timeMs + beatMs * (diff === "expert" ? 3 : 2))
        : undefined;
      notes.push({
        timeMs,
        lane,
        type: shouldHold ? "hold" : "tap",
        endTimeMs,
      });
    });

    if (["hard", "expert"].includes(diff) && rand() < 0.5) {
      const chordTime = Math.round(startAt + barOffsetBeats * beatMs);
      notes.push(
        { timeMs: chordTime, lane: 0, type: "tap" },
        { timeMs: chordTime, lane: 3, type: "tap" },
      );
    }
  }

  if (notes.length < 8) {
    const spacing = Math.max(beatMs * 2, 400);
    for (let i = 0; i < 8; i++) {
      notes.push({
        timeMs: Math.round(startAt + i * spacing),
        lane: i % 4,
        type: "tap",
      });
    }
  }

  notes.sort((a, b) => a.timeMs - b.timeMs);

  // Minimum spacing per lane to keep easy/medium playable
  const minGap = MIN_GAP_BY_DIFF[diff] ?? 180;
  const lastByLane: Record<number, number> = {};
  const filtered: RawNote[] = [];
  for (const n of notes) {
    const last = lastByLane[n.lane] ?? -Infinity;
    if (n.timeMs - last < minGap) {
      if (diff !== "expert") continue;
    }
    lastByLane[n.lane] = n.timeMs;
    filtered.push(n);
  }

  return {
    songId: trackId,
    title: title || trackId,
    artist: artist || "STEMSTATION",
    bpm,
    offsetMs,
    difficulty: difficulty.toLowerCase(),
    notes: filtered,
  };
}



// General MIDI percussion map: kick → 0, snare → 1, hat → 2, cymbal/tom → 3.
function drumLane(pitch: number): number {
  if (pitch === 35 || pitch === 36) return 0;          // kick
  if (pitch === 38 || pitch === 40) return 1;          // snare / clap (39)
  if (pitch === 39) return 1;
  if (pitch >= 42 && pitch <= 46) return 2;            // closed/open hat, pedal
  if (pitch === 49 || pitch === 51 || pitch === 55 || pitch === 57) return 3; // cymbals
  if (pitch >= 41 && pitch <= 50) return 3;            // toms → cymbal lane
  // unknown drum pitch — fold by mod
  return Math.abs(pitch) % 4;
}

function bassLane(pitch: number): number {
  // Concentrate bass on lanes 0-1 with a contour bias toward 0 for low notes.
  if (pitch < 36) return 0;
  if (pitch < 44) return 1;
  if (pitch < 52) return 0;
  return 1;
}

function vocalLane(pitch: number, idx: number): number {
  // Vocals favor the inner lanes (2,3) with lane chosen by phrase-step parity.
  return 2 + ((Math.floor(pitch / 2) + idx) % 2);
}

function contourLane(pitch: number, median: number): number {
  // Map pitch relative to the track's median to one of 4 lanes (left=low → right=high).
  const delta = pitch - median;
  if (delta <= -7) return 0;
  if (delta < 0)   return 1;
  if (delta < 7)   return 2;
  return 3;
}

function mapPitchToLane(pitch: number, stem: string, median: number, idx: number = 0): number {
  switch (stem.toLowerCase()) {
    case "drums":  return drumLane(pitch);
    case "bass":   return bassLane(pitch);
    case "vocals": return vocalLane(pitch, idx);
    case "melody":
    case "other":
    default:       return contourLane(pitch, median);
  }
}

function hashSeed(...parts: string[]): number {
  return Math.abs(
    parts.join("|").split("").reduce((acc, ch) => (acc << 5) - acc + ch.charCodeAt(0), 0),
  );
}

function quantize(ms: number, bpm: number | null, division: number = 4) {
  if (!bpm || bpm <= 0) return ms;
  const beatMs = 60000 / bpm;
  const grid = beatMs / division;
  return Math.round(ms / grid) * grid;
}

type MidiNoteIn = { timeMs: number; durationMs: number; pitch: number; velocity: number };

async function chartFromMidi(trackId: string, stem: string, difficulty: string): Promise<ChartFile | null> {
  try {
    const midiMod = await import("@tonejs/midi");
    const { Midi } = midiMod;
    const safeId = sanitizeId(trackId);
    const stemLower = stem.toLowerCase();
    // Stem-specific MIDI file is preferred. The generic file is a last resort.
    const candidates = [
      path.join(MIDI_DIR, `${safeId}_${stemLower}.mid`),
      path.join(MIDI_DIR, `${safeId}.mid`),
    ];
    let midiPath: string | null = null;
    let isStemSpecific = false;
    for (const c of candidates) {
      try {
        await fs.access(c);
        midiPath = c;
        isStemSpecific = c.includes(`_${stemLower}.mid`);
        break;
      } catch {
        // continue
      }
    }
    if (!midiPath) return null;

    const data = await fs.readFile(midiPath);
    const midi = new Midi(data);
    const raw: MidiNoteIn[] = [];
    midi.tracks.forEach((tr) => {
      tr.notes.forEach((n) => {
        raw.push({
          timeMs: Math.round(n.time * 1000),
          durationMs: Math.max(0, Math.round(n.duration * 1000)),
          pitch: (n as any).midi ?? 60,
          velocity: typeof n.velocity === "number" ? n.velocity : 0.8,
        });
      });
    });
    if (!raw.length) return null;

    // When pulled from a generic MIDI, narrow to the pitch band the stem typically
    // occupies before mapping to lanes.
    let working = raw;
    if (!isStemSpecific) {
      if (stemLower === "drums") {
        // GM drum channel notes live around 35-81; filter to that band when the
        // generic MIDI mixes melody + drums.
        working = raw.filter((n) => n.pitch >= 35 && n.pitch <= 81 && n.durationMs <= 250);
      } else if (stemLower === "bass") {
        working = raw.filter((n) => n.pitch < 52);
      } else if (stemLower === "vocals") {
        working = raw.filter((n) => n.pitch >= 55 && n.pitch <= 84);
      } else if (stemLower === "melody") {
        working = raw.filter((n) => n.pitch >= 52);
      }
      if (!working.length) working = raw;
    }

    // Compute median pitch for contour-based lane mapping.
    const pitches = [...working].map((n) => n.pitch).sort((a, b) => a - b);
    const median = pitches[Math.floor(pitches.length / 2)] ?? 60;

    const bpm = midi.header.tempos[0]?.bpm ?? null;
    const diff = difficulty.toLowerCase();
    const minGap = MIN_GAP_BY_DIFF[diff] ?? 180;
    const dropRate = DROP_RATE_BY_DIFF[diff] ?? 0;
    const allowHolds = diff !== "easy";
    const seed = hashSeed(trackId, stemLower, diff);
    const rand = seededRandom(seed);

    // Lane-mapped, quantized, velocity-tagged.
    const mapped = working
      .map((n, idx) => {
        const lane = mapPitchToLane(n.pitch, stemLower, median, idx);
        const start = quantize(n.timeMs, bpm, 4) + NOTE_TRAVEL_MS;
        const isHold = allowHolds && n.durationMs > 240;
        const sustain = diff === "expert" ? n.durationMs : Math.min(n.durationMs, 600);
        return {
          timeMs: start,
          lane,
          type: isHold ? "hold" : "tap",
          endTimeMs: isHold ? quantize(n.timeMs + sustain, bpm, 4) + NOTE_TRAVEL_MS : undefined,
          durationMs: isHold ? sustain : undefined,
          pitch: n.pitch,
          velocity: n.velocity,
        };
      })
      .sort((a, b) => a.timeMs - b.timeMs);

    // Density culling: drop the quietest notes first within each min-gap window.
    // For easy/medium also apply a deterministic top-up drop driven by the seeded RNG.
    const lastByLane: Record<number, number> = {};
    const filtered: RawNote[] = [];
    for (const n of mapped) {
      const last = lastByLane[n.lane] ?? -Infinity;
      if (n.timeMs - last < minGap) {
        if (diff !== "expert") continue;
      }
      // Velocity-weighted drop: louder notes (>0.6) survive even at higher drop rates.
      if (dropRate > 0 && n.velocity < 0.6 && rand() < dropRate) continue;
      lastByLane[n.lane] = n.timeMs;
      filtered.push({
        timeMs: n.timeMs,
        lane: n.lane,
        type: n.type,
        endTimeMs: n.endTimeMs,
        durationMs: n.durationMs,
        pitch: n.pitch,
      });
    }

    return {
      songId: trackId,
      title: path.basename(midiPath),
      artist: "STEMSTATION",
      bpm,
      offsetMs: 0,
      difficulty: diff,
      notes: filtered,
    };
  } catch (err) {
    console.warn("STEMSTATION midi parse failed", err);
    return null;
  }
}

async function autoGenerateChart(
  trackId: string,
  stem: string,
  difficulty: string,
  offsetMs: number,
): Promise<ChartFile | null> {
  const audioPath = await findAudioFile(trackId);
  const meta = audioPath
    ? await readAudioMeta(audioPath)
    : { durationMs: null, bpm: null, title: null, artist: null };

  const chart = buildProceduralChart({
    trackId,
    stem,
    title: meta.title ?? (audioPath ? path.basename(audioPath) : trackId),
    artist: meta.artist ?? "STEMSTATION",
    bpm: meta.bpm || 120,
    durationMs: meta.durationMs || DEFAULT_DURATION_MS,
    difficulty,
    offsetMs,
  });

  const safeId = sanitizeId(trackId);
  await ensureDir(CHART_DIR);
  const target = path.join(CHART_DIR, `${safeId}_${stem}_${difficulty}.json`);
  await writeIfChanged(target, JSON.stringify(chart, null, 2));

  return chart;
}

function pickDifficultyBlock(stem: StemBlock | undefined, requestedDifficulty: string) {
  if (!stem?.difficulties) return null;
  const order = [requestedDifficulty, "expert", "normal", "easy"];
  for (const key of order) {
    const block = stem.difficulties[key];
    if (block?.notes && block.notes.length) return block;
  }
  // fall back to any non-empty difficulty
  const any = Object.values(stem.difficulties).find((b) => b?.notes?.length);
  return any || null;
}

function normalizeNotes(notes: RawNote[]): RawNote[] {
  return notes
    .filter((n) => typeof n?.timeMs === "number")
    .map((n) => ({
      ...n,
      endTimeMs:
        typeof n?.endTimeMs === "number"
          ? n.endTimeMs
          : typeof n?.holdDuration === "number"
          ? (n.timeMs || 0) + Number(n.holdDuration)
          : typeof n?.durationMs === "number"
          ? (n.timeMs || 0) + Number(n.durationMs)
          : undefined,
    }))
    .sort((a, b) => a.timeMs - b.timeMs);
}

function pickStemNotes(chart: ChartFile, stemName: string, requestedDifficulty: string): RawNote[] | null {
  if (!chart.stems) return null;
  const stem = chart.stems[stemName];
  if (!stem) return null;
  const block = pickDifficultyBlock(stem, requestedDifficulty);
  if (!block?.notes) return null;
  return normalizeNotes(block.notes as RawNote[]);
}

function chartMatches(chart: ChartFile, stem: string, difficulty: string) {
  if (chart.stems && chart.stems[stem]) {
    const block = chart.stems[stem].difficulties?.[difficulty];
    if (block?.notes?.length) return true;
  }
  if (chart.difficulty && chart.difficulty.toLowerCase() === difficulty.toLowerCase()) return true;
  return false;
}

function shouldUseCandidate(candidate: string, stem?: string, difficulty?: string) {
  if (!stem || !difficulty) return false;
  return candidate.includes(`_${stem}_${difficulty}.json`) || candidate.endsWith(`_${difficulty}.json`);
}

function normalizeChartForResponse(chart: ChartFile, trackId: string, requestedDifficulty: string, stem: string) {
  const fromStem = pickStemNotes(chart, stem, requestedDifficulty);
  const notes = fromStem ?? normalizeNotes(Array.isArray(chart?.notes) ? chart.notes as RawNote[] : []);

  return {
    songId: chart.songId || chart.trackId || trackId,
    title: chart.title || chart.songName || null,
    artist: chart.artist || null,
    bpm: chart.bpm || null,
    offsetMs: chart.offsetMs ?? chart.audioOffsetMs ?? 0,
    difficulty: chart.difficulty || requestedDifficulty || null,
    notes,
    requestedDifficulty: requestedDifficulty || null,
    requestedStem: stem || null,
  };
}

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get("trackId");
  const difficulty = (req.nextUrl.searchParams.get("difficulty") || "normal").toLowerCase();
  const stem = (req.nextUrl.searchParams.get("stem") || "melody").toLowerCase();
  const auto = req.nextUrl.searchParams.get("auto");
  const offsetMs = Number(req.nextUrl.searchParams.get("offsetMs") || 0);
  const allowAuto = auto !== "0";

  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  try {
    const existing = await loadExistingChart(trackId, stem, difficulty);
    if (existing && chartMatches(existing, stem, difficulty)) {
      return NextResponse.json(normalizeChartForResponse(existing, trackId, difficulty, stem));
    }

    if (!allowAuto) {
      return NextResponse.json({ error: "Chart not found", notes: [] }, { status: 404 });
    }

    const midiChart = await chartFromMidi(trackId, stem, difficulty);
    if (midiChart) {
      const safeId = sanitizeId(trackId);
      await ensureDir(CHART_DIR);
      const target = path.join(CHART_DIR, `${safeId}_${stem}_${difficulty}.json`);
      await writeIfChanged(target, JSON.stringify(midiChart, null, 2));
      return NextResponse.json(normalizeChartForResponse(midiChart, trackId, difficulty, stem));
    }

    const generated = await autoGenerateChart(trackId, stem, difficulty, offsetMs);
    if (generated) {
      return NextResponse.json(normalizeChartForResponse(generated, trackId, difficulty, stem));
    }

    return NextResponse.json({ error: "Unable to generate chart", notes: [] }, { status: 500 });
  } catch (err: any) {
    console.error("STEMSTATION chart load/generate failed", err);
    return NextResponse.json({ error: "Failed to load chart" }, { status: 500 });
  }
}
