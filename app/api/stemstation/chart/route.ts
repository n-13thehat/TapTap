import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { RevolutionaryChartEngine, RevolutionaryChartConfig } from "@/lib/stemstation/RevolutionaryChartEngine";

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

function buildProceduralChart({
  trackId,
  title,
  artist,
  bpm,
  durationMs,
  difficulty,
  offsetMs,
}: {
  trackId: string;
  title?: string | null;
  artist?: string | null;
  bpm: number;
  durationMs: number;
  difficulty: string;
  offsetMs: number;
}): ChartFile {
  const diff = difficulty.toLowerCase();
  const densityMap: Record<string, number> = {
    easy: 0.18,
    medium: 0.45,
    hard: 0.75,
    expert: 1.0,
  };
  const holdChance: Record<string, number> = {
    easy: 0,
    medium: 0.05,
    hard: 0.14,
    expert: 0.22,
  };
  const beatMs = 60000 / Math.max(60, bpm || 120);
  const startAt = NOTE_TRAVEL_MS + offsetMs;
  const totalBeats = Math.max(8, Math.floor(durationMs / beatMs));
  const beatsPerBar = 4;
  const totalBars = Math.ceil(totalBeats / beatsPerBar);
  const seed = Math.abs(
    Array.from(`${trackId}-${difficulty}`).reduce(
      (acc, ch) => (acc << 5) - acc + ch.charCodeAt(0),
      0,
    ),
  );
  const rand = seededRandom(seed);
  const patterns: Array<{ beats: number[]; lanes: number[] }> = [
    { beats: [0, 2], lanes: [0, 3] },
    { beats: [0, 1, 2, 3], lanes: [0, 1, 2, 3] },
    { beats: [0, 1.5, 2, 3.5], lanes: [1, 2, 1, 3] },
    { beats: [0, 0.5, 1, 2.5, 3], lanes: [2, 1, 3, 1, 2] },
    { beats: [0, 1.25, 2.5, 3.25], lanes: [3, 0, 2, 1] },
  ];

  const notes: RawNote[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const pattern = patterns[(seed + bar) % patterns.length];
    const barOffsetBeats = bar * beatsPerBar;
    const density = densityMap[diff] ?? 0.55;
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

async function emitMidi(chart: ChartFile, safeId: string) {
  try {
    const midiLib = await import("@tonejs/midi");
    const { Midi } = midiLib;
    const midi = new Midi();
    if (chart.bpm) midi.header.setTempo(chart.bpm);
    const tr = midi.addTrack();
    for (const note of chart.notes || []) {
      const start = Math.max(0, note.timeMs / 1000);
      const duration =
        note.type === "hold" && note.endTimeMs
          ? Math.max(0.1, (note.endTimeMs - note.timeMs) / 1000)
          : 0.18;
      tr.addNote({
        midi: 48 + (note.lane ?? 0) * 4,
        time: start,
        duration,
        velocity: 0.9,
      });
    }
    await ensureDir(MIDI_DIR);
    const midiPath = path.join(MIDI_DIR, `${safeId}.mid`);
    await fs.writeFile(midiPath, Buffer.from(midi.toArray()));
  } catch (err) {
    console.warn("STEMSTATION MIDI emit skipped", err);
  }
}

function mapPitchToLane(pitch: number): number {
  if (pitch < 50) return 0;
  if (pitch < 60) return 1;
  if (pitch < 72) return 2;
  return 3;
}

function quantize(ms: number, bpm: number | null, division: number = 4) {
  if (!bpm || bpm <= 0) return ms;
  const beatMs = 60000 / bpm;
  const grid = beatMs / division;
  return Math.round(ms / grid) * grid;
}

async function chartFromMidi(trackId: string, stem: string, difficulty: string): Promise<ChartFile | null> {
  try {
    const midiMod = await import("@tonejs/midi");
    const { Midi } = midiMod;
    const safeId = sanitizeId(trackId);
    const candidates = [
      path.join(MIDI_DIR, `${safeId}_${stem}.mid`),
      ...(stem === "melody"
        ? [path.join(MIDI_DIR, `${safeId}_other.mid`), path.join(MIDI_DIR, `${safeId}_bass.mid`)]
        : []),
      path.join(MIDI_DIR, `${safeId}.mid`),
    ];
    let midiPath: string | null = null;
    let isStemSpecific = false;
    for (const c of candidates) {
      try {
        await fs.access(c);
        midiPath = c;
        isStemSpecific = c.includes(`_${stem}.mid`);
        break;
      } catch {
        // continue
      }
    }
    if (!midiPath) return null;

    const data = await fs.readFile(midiPath);
    const midi = new Midi(data);
    const all: RawNote[] = [];
    midi.tracks.forEach((tr) => {
      tr.notes.forEach((n) => {
        const timeMs = Math.round(n.time * 1000);
        const durationMs = Math.max(0, Math.round(n.duration * 1000));
        const lane = mapPitchToLane((n as any).midi ?? 60);
        all.push({
          timeMs: timeMs + NOTE_TRAVEL_MS,
          lane,
          type: durationMs > 0 ? "hold" : "tap",
          endTimeMs: timeMs + durationMs + NOTE_TRAVEL_MS,
          durationMs,
          pitch: (n as any).midi ?? 60,
        });
      });
    });

    // Stem-specific filtering if we only have a generic MIDI
    let working = all;
    if (!isStemSpecific) {
      const stemLower = stem.toLowerCase();
      if (stemLower === "drums") {
        working = working
          .filter((n) => n.lane <= 1 || (n.pitch ?? 0) < 60)
          .map((n) => ({ ...n, type: "tap", endTimeMs: undefined }));
      } else if (stemLower === "melody") {
        working = working.filter((n) => n.lane >= 2 || (n.pitch ?? 0) >= 60);
      } else if (stemLower === "vocals") {
        let alt = 0;
        const vocals = working.filter((n) => (n.pitch ?? 0) >= 55 && (n.pitch ?? 0) <= 80);
        working = vocals.map((n) => {
          const lane = 2 + (alt++ % 2);
          const dur = n.durationMs && n.durationMs > 120 ? n.durationMs : 180;
          return { ...n, lane, type: "hold", endTimeMs: n.timeMs + dur };
        });
      }
    }

    const bpm = midi.header.tempos[0]?.bpm ?? null;
    const sorted = working
      .map((n) => ({
        ...n,
        timeMs: quantize(n.timeMs, bpm, 4),
        endTimeMs: n.endTimeMs ? quantize(n.endTimeMs, bpm, 4) : n.endTimeMs,
      }))
      .sort((a, b) => a.timeMs - b.timeMs);
    const minGap = MIN_GAP_BY_DIFF[difficulty.toLowerCase()] ?? 180;
    const dropRate = DROP_RATE_BY_DIFF[difficulty.toLowerCase()] ?? 0;
    const lastByLane: Record<number, number> = {};
    const filtered: RawNote[] = [];
    sorted.forEach((n) => {
      const last = lastByLane[n.lane] ?? -Infinity;
      if (n.timeMs - last < minGap && difficulty.toLowerCase() !== "expert") return;
      if (dropRate > 0 && Math.random() < dropRate) return;
      lastByLane[n.lane] = n.timeMs;
      filtered.push(n);
    });

    return {
      songId: trackId,
      title: path.basename(midiPath),
      artist: "STEMSTATION",
      bpm,
      offsetMs: 0,
      difficulty: difficulty.toLowerCase(),
      notes: filtered,
    };
  } catch (err) {
    console.warn("STEMSTATION midi parse failed", err);
    return null;
  }
}

async function autoGenerateChart(trackId: string, difficulty: string, offsetMs: number): Promise<ChartFile | null> {
  const audioPath = await findAudioFile(trackId);
  const meta = audioPath
    ? await readAudioMeta(audioPath)
    : { durationMs: null, bpm: null, title: null, artist: null };

  const chart = buildProceduralChart({
    trackId,
    title: meta.title ?? (audioPath ? path.basename(audioPath) : trackId),
    artist: meta.artist ?? "STEMSTATION",
    bpm: meta.bpm || 120,
    durationMs: meta.durationMs || DEFAULT_DURATION_MS,
    difficulty,
    offsetMs,
  });

  const safeId = sanitizeId(trackId);
  await ensureDir(CHART_DIR);
  await fs.writeFile(path.join(CHART_DIR, `${safeId}_${difficulty}.json`), JSON.stringify(chart, null, 2), "utf-8");
  await emitMidi(chart, safeId);

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

/**
 * Generate revolutionary chart using the new AI-powered engine
 */
async function generateRevolutionaryChart(
  trackId: string,
  stem: string,
  difficulty: string,
  options: { useAI: boolean; qualityLevel: string; offsetMs: number }
): Promise<ChartFile & { quality_metrics?: any } | null> {
  console.log(`🚀 Generating revolutionary chart for ${trackId} (${stem}/${difficulty})`);

  try {
    // Find audio file
    const audioPath = await findAudioFile(trackId);
    if (!audioPath) {
      console.warn("No audio file found for revolutionary chart generation");
      return null;
    }

    // Load audio metadata
    const meta = await readAudioMeta(audioPath);

    // Create audio context (simplified for server-side)
    // In a real implementation, you'd use a proper audio processing library
    const mockAudioContext = {
      sampleRate: 44100,
      createBuffer: () => null,
      decodeAudioData: () => null
    } as any;

    // Initialize revolutionary engine
    const engine = new RevolutionaryChartEngine(mockAudioContext);

    // Configure revolutionary generation
    const config: RevolutionaryChartConfig = {
      use_ai_analysis: options.useAI,
      musical_intelligence_level: options.qualityLevel === 'high' ? 'professional' :
                                 options.qualityLevel === 'balanced' ? 'advanced' : 'basic',
      target_difficulties: [difficulty as any],
      instruments: [stem as any],
      enable_advanced_notes: true,
      enable_dynamic_difficulty: true,
      enable_real_time_adaptation: false,
      beat_detection_quality: options.qualityLevel as any,
      harmonic_analysis_depth: options.useAI ? 'advanced' : 'basic',
      use_gpu_acceleration: false, // Server-side
      enable_caching: true
    };

    // For now, create a mock audio buffer and stems
    // In production, you'd load and process the actual audio files
    const mockAudioBuffer = {
      duration: (meta.durationMs || DEFAULT_DURATION_MS) / 1000,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: () => new Float32Array(44100 * 3) // 3 seconds of silence
    } as AudioBuffer;

    const mockStemBuffers = {
      [stem]: mockAudioBuffer
    };

    // Generate revolutionary charts
    const result = await engine.generateRevolutionaryCharts(
      mockAudioBuffer,
      mockStemBuffers,
      config
    );

    if (result.charts.length === 0) {
      return null;
    }

    // Convert to ChartFile format
    const revolutionaryChart = result.charts[0];
    const chartFile: ChartFile & { quality_metrics?: any } = {
      songId: trackId,
      title: meta.title || trackId,
      artist: meta.artist || "STEMSTATION",
      bpm: meta.bpm || revolutionaryChart.musical_context.beat_analysis.bpm || 120,
      offsetMs: options.offsetMs,
      difficulty: difficulty.toLowerCase(),
      notes: revolutionaryChart.notes.map(note => ({
        timeMs: note.timeMs,
        lane: note.lane,
        type: note.type,
        endTimeMs: note.duration ? note.timeMs + note.duration : undefined,
        holdDuration: note.duration,
        pitch: note.pitch
      })),
      quality_metrics: result.quality_metrics
    };

    console.log(`✅ Revolutionary chart generated with ${chartFile.notes?.length} notes`);
    console.log(`📊 Quality Score: ${(result.quality_metrics.overall_score * 100).toFixed(1)}%`);

    return chartFile;

  } catch (error) {
    console.error("Revolutionary chart generation failed:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get("trackId");
  const difficulty = (req.nextUrl.searchParams.get("difficulty") || "normal").toLowerCase();
  const stem = (req.nextUrl.searchParams.get("stem") || "melody").toLowerCase();
  const auto = req.nextUrl.searchParams.get("auto");
  const offsetMs = Number(req.nextUrl.searchParams.get("offsetMs") || 0);
  const allowAuto = auto !== "0";

  // NEW: Revolutionary chart engine parameters
  const useRevolutionary = req.nextUrl.searchParams.get("revolutionary") === "true";
  const useAI = req.nextUrl.searchParams.get("ai") === "true";
  const qualityLevel = req.nextUrl.searchParams.get("quality") || "balanced";

  if (!trackId) {
    return NextResponse.json({ error: "trackId required" }, { status: 400 });
  }

  try {
    // Check for existing charts first (backward compatibility)
    const existing = await loadExistingChart(trackId, stem, difficulty);
    if (existing && chartMatches(existing, stem, difficulty) && !useRevolutionary) {
      return NextResponse.json(normalizeChartForResponse(existing, trackId, difficulty, stem));
    }

    if (!allowAuto && !useRevolutionary) {
      return NextResponse.json({ error: "Chart not found", notes: [] }, { status: 404 });
    }

    // NEW: Revolutionary chart generation
    if (useRevolutionary) {
      try {
        const revolutionaryChart = await generateRevolutionaryChart(
          trackId,
          stem,
          difficulty,
          { useAI, qualityLevel, offsetMs }
        );

        if (revolutionaryChart) {
          // Save the revolutionary chart
          const safeId = sanitizeId(trackId);
          await ensureDir(CHART_DIR);
          await fs.writeFile(
            path.join(CHART_DIR, `${safeId}_${stem}_${difficulty}_revolutionary.json`),
            JSON.stringify(revolutionaryChart, null, 2),
            "utf-8"
          );

          return NextResponse.json({
            ...normalizeChartForResponse(revolutionaryChart, trackId, difficulty, stem),
            revolutionary: true,
            ai_powered: useAI,
            quality_metrics: revolutionaryChart.quality_metrics
          });
        }
      } catch (revolutionaryError) {
        console.warn("Revolutionary chart generation failed, falling back to traditional:", revolutionaryError);
        // Fall through to traditional methods
      }
    }

    // Traditional chart generation (existing logic)
    const midiChart = await chartFromMidi(trackId, stem, difficulty);
    if (midiChart) {
      const safeId = sanitizeId(trackId);
      await ensureDir(CHART_DIR);
      await fs.writeFile(path.join(CHART_DIR, `${safeId}_${stem}_${difficulty}.json`), JSON.stringify(midiChart, null, 2), "utf-8");
      return NextResponse.json(normalizeChartForResponse(midiChart, trackId, difficulty, stem));
    }

    const generated = await autoGenerateChart(trackId, difficulty, offsetMs);
    if (generated) {
      return NextResponse.json(normalizeChartForResponse(generated, trackId, difficulty, stem));
    }

    return NextResponse.json({ error: "Unable to generate chart", notes: [] }, { status: 500 });
  } catch (err: any) {
    console.error("STEMSTATION chart load/generate failed", err);
    return NextResponse.json({ error: "Failed to load chart" }, { status: 500 });
  }
}
