"use client";
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronLeft, Play, Star, Trophy, Settings, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile, TouchButton } from "@/components/mobile/MobileOptimizations";

// ---------------------------------------------------------------------------
// Types - TTR3 Style
// ---------------------------------------------------------------------------

type GameState = "menu" | "songSelect" | "difficultySelect" | "countdown" | "playing" | "paused" | "results";
type Judgement = "Perfect" | "Great" | "Good" | "Miss";
type NoteState = "pending" | "hit" | "miss";
type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";
type Stem = "melody" | "drums" | "vocals";

interface GameNote {
  id: string;
  lane: number; // 0-3
  timeMs: number;
  type: "tap" | "hold" | "slide" | "chord" | "hammer" | "pull";
  holdDuration?: number;
  // NEW: Revolutionary note features
  slideDirection?: "up" | "down" | "left" | "right";
  chordLanes?: number[];
  specialEffect?: string;
  glowIntensity?: number;
  isAdvanced?: boolean;
}

interface TrackData {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  bpm?: number;
  duration?: number;
  audioUrl?: string | null;
  rating?: number; // 1-5 stars
  plays?: number;
  highScore?: number;
  difficulties?: Difficulty[];
  difficulty?: string;
  chartSeed?: number | null;
  // NEW: Revolutionary chart features
  supportsRevolutionary?: boolean;
  aiGenerated?: boolean;
  qualityScore?: number;
}

interface GameEngine {
  status: GameState;
  startTimeMs: number;
  pausedAtMs: number;
  countdownStartMs: number;
  selectedTrack: TrackData | null;
  selectedDifficulty: Difficulty;
}

interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  accuracy: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string | null;
  score: number;
  accuracy: number;
  maxCombo: number;
  submittedAt?: string;
}

// ---------------------------------------------------------------------------
// Constants - TTR3 Style
// ---------------------------------------------------------------------------

const LANES = [0, 1, 2, 3] as const;
const LANE_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
const KEY_BINDINGS: Record<string, number> = {
  KeyD: 0,
  KeyF: 1,
  KeyJ: 2,
  KeyK: 3,
};

const HIT_WINDOWS = {
  perfect: 50,
  great: 100,
  good: 150,
  miss: 200,
};

const SCORE_VALUES = {
  Perfect: 300,
  Great: 100,
  Good: 50,
  Miss: 0,
};

const LANE_HEIGHT = 600;
const NOTE_SPEED = 0.4; // pixels per ms
const NOTE_TRAVEL_MS = LANE_HEIGHT / NOTE_SPEED; // ~1.5s travel
const HIT_LINE_Y = LANE_HEIGHT - 80;

// Mobile and circular hit box constants
const CIRCULAR_HIT_RADIUS = 35; // Radius for circular hit zones
const MOBILE_LANE_HEIGHT = 500; // Shorter lanes for mobile
const MOBILE_HIT_LINE_Y = MOBILE_LANE_HEIGHT - 70;
const TOUCH_FEEDBACK_DURATION = 150; // ms for touch visual feedback

const DEFAULT_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function buildChart(track: TrackData, difficulty: Difficulty, offsetMs: number): GameNote[] {
  const bpm = track.bpm && Number.isFinite(track.bpm) ? Number(track.bpm) : 120;
  const durationMs = Math.max(30_000, Math.min((track.duration ?? 180) * 1000, 120_000));
  const seed = typeof track.chartSeed === "number"
    ? track.chartSeed
    : Math.abs(Array.from(track.id).reduce((a, c) => (a << 5) - a + c.charCodeAt(0), 0));
  const rand = seededRandom(seed + difficulty.length * 137);

  const beatMs = 60000 / Math.max(60, bpm);
  const startAt = NOTE_TRAVEL_MS + offsetMs;
  const beatsPerBar = 4;
  const totalBeats = Math.max(8, Math.floor(durationMs / beatMs));
  const totalBars = Math.ceil(totalBeats / beatsPerBar);

  const densityByDiff = { Easy: 0.35, Medium: 0.55, Hard: 0.8, Expert: 1.0 } as const;
  const holdChanceByDiff = { Easy: 0.03, Medium: 0.08, Hard: 0.14, Expert: 0.22 } as const;
  const patternBank: Array<{ beats: number[]; lanes: number[] }> = [
    { beats: [0, 2], lanes: [0, 3] }, // backbeat
    { beats: [0, 1.5, 2, 3.5], lanes: [1, 2, 1, 3] }, // swingy
    { beats: [0, 1, 2, 3], lanes: [0, 1, 2, 3] }, // scale
    { beats: [0, 0.5, 1, 2.5, 3], lanes: [2, 1, 3, 1, 2] }, // gallop
    { beats: [0, 1.25, 2.5, 3.25], lanes: [3, 0, 2, 1] }, // off-grid accents
  ];

  const notes: GameNote[] = [];
  for (let bar = 0; bar < totalBars; bar++) {
    const pattern = patternBank[(seed + bar) % patternBank.length];
    const barOffsetBeats = bar * beatsPerBar;
    const density = densityByDiff[difficulty];
    pattern.beats.forEach((beat, idx) => {
      if (rand() > density) return;
      const lane = pattern.lanes[idx % pattern.lanes.length];
      const timeMs = Math.round(startAt + (barOffsetBeats + beat) * beatMs);
      const isHold = rand() < holdChanceByDiff[difficulty];
      const holdDuration = isHold ? beatMs * (difficulty === "Expert" ? 3 : 2) : undefined;
      notes.push({
        id: `${track.id}-${difficulty}-${bar}-${idx}`,
        lane,
        timeMs,
        type: isHold ? "hold" : "tap",
        holdDuration,
      });
    });

    // Add bar-start emphasis and occasional chord on harder difficulties.
    if (difficulty === "Hard" || difficulty === "Expert") {
      const chordTime = Math.round(startAt + barOffsetBeats * beatMs);
      if (rand() < 0.5) {
        notes.push(
          { id: `${track.id}-${difficulty}-${bar}-ch0`, lane: 0, timeMs: chordTime, type: "tap" },
          { id: `${track.id}-${difficulty}-${bar}-ch3`, lane: 3, timeMs: chordTime, type: "tap" },
        );
      }
    }
  }

  if (notes.length < 8) {
    const fallbackSpacing = Math.max(beatMs * 2, 400);
    for (let i = 0; i < 8; i++) {
      notes.push({
        id: `${track.id}-${difficulty}-fallback-${i}`,
        lane: i % 4,
        timeMs: Math.round(startAt + i * fallbackSpacing),
        type: "tap",
      });
    }
  }

  return notes.sort((a, b) => a.timeMs - b.timeMs);
}

function computeAccuracyFromStats(stats: GameStats) {
  const total = stats.perfect + stats.great + stats.good + stats.miss;
  if (!total) return 0;
  const weighted =
    stats.perfect * 1 +
    stats.great * 0.85 +
    stats.good * 0.6;
  return Math.round(Math.max(0, Math.min(100, (weighted / total) * 100)));
}

function safeRunId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `run-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Screen Components
// ---------------------------------------------------------------------------

function MainMenu({
  onStart,
  loading,
  hasTracks,
  error,
}: {
  onStart: () => void;
  loading: boolean;
  hasTracks: boolean;
  error: string | null;
}) {
  return (
    <motion.div
      key="menu"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="flex flex-col items-center justify-center min-h-screen p-8"
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-4">
            STEM STATION
          </h1>
          <p className="text-xl text-gray-300">Rhythm • Precision • Flow</p>
          <p className="mt-2 text-sm text-gray-400">
            Local STEMSTATION library with real audio and leaderboards.
          </p>
          {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <button
            onClick={onStart}
            disabled={loading || !hasTracks}
            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-xl font-semibold hover:from-purple-500 hover:to-blue-500 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-60 disabled:hover:scale-100"
          >
            {loading ? <Loader2 className="inline mr-3 animate-spin" size={22} /> : <Play className="inline mr-3" size={24} />}
            {loading ? "Loading tracks" : hasTracks ? "START GAME" : "No tracks found"}
          </button>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Settings className="inline mr-2" size={20} />
            Settings
          </button>
          <button className="px-6 py-3 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors">
            <Trophy className="inline mr-2" size={20} />
            Scores
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SongSelect({
  tracks,
  onSelect,
  onBack
}: {
  tracks: TrackData[];
  onSelect: (track: TrackData) => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      key="songSelect"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="min-h-screen p-6"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-3xl font-bold">Select Track</h2>
        </div>

        {!tracks.length && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            No local STEMSTATION tracks found. Add MP3s under <code className="text-white">app/stemstation/Music For The Future -vx9</code>.
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(track)}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 cursor-pointer hover:from-gray-700 hover:to-gray-800 transform hover:scale-105 transition-all duration-200 border border-gray-700"
            >
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold">{track.title[0]}</span>
              </div>

              <h3 className="font-bold text-lg mb-1">{track.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{track.artist}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <Star className="mr-1" size={12} fill="currentColor" />
                  {track.rating}/5
                </div>
                <div>{track.plays} plays</div>
              </div>

              <div className="mt-2 text-xs text-gray-400">
                High Score: {track.highScore?.toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function DifficultySelect({
  track,
  onSelect,
  onBack,
  useRevolutionary,
  setUseRevolutionary,
  useAI,
  setUseAI,
  qualityLevel,
  setQualityLevel
}: {
  track: TrackData;
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
  useRevolutionary: boolean;
  setUseRevolutionary: (value: boolean) => void;
  useAI: boolean;
  setUseAI: (value: boolean) => void;
  qualityLevel: "fast" | "balanced" | "high";
  setQualityLevel: (value: "fast" | "balanced" | "high") => void;
}) {
  const difficultyColors = {
    Easy: "from-green-500 to-green-600",
    Medium: "from-yellow-500 to-orange-500",
    Hard: "from-red-500 to-red-600",
    Expert: "from-purple-500 to-purple-600"
  };
  const options = (track.difficulties && track.difficulties.length ? track.difficulties : DEFAULT_DIFFICULTIES);

  return (
    <motion.div
      key="difficultySelect"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -300, opacity: 0 }}
      className="min-h-screen p-6 flex items-center justify-center"
    >
      <div className="max-w-2xl w-full">
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-3xl font-bold">{track.title}</h2>
            <p className="text-gray-400">{track.artist}</p>
          </div>
        </div>

        {/* Revolutionary Chart Settings */}
        <div className="mb-8 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Settings className="mr-2" size={20} />
            Chart Generation Settings
          </h3>

          <div className="space-y-4">
            {/* Revolutionary Engine Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-lg font-semibold">Revolutionary Engine</label>
                <p className="text-sm text-gray-400">Use AI-powered chart generation</p>
              </div>
              <button
                onClick={() => setUseRevolutionary(!useRevolutionary)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  useRevolutionary ? 'bg-blue-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  useRevolutionary ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* AI Analysis Toggle */}
            {useRevolutionary && (
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-lg font-semibold">AI Musical Analysis</label>
                  <p className="text-sm text-gray-400">Advanced harmonic and structural analysis</p>
                </div>
                <button
                  onClick={() => setUseAI(!useAI)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    useAI ? 'bg-purple-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    useAI ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            )}

            {/* Quality Level */}
            {useRevolutionary && (
              <div>
                <label className="text-lg font-semibold block mb-2">Quality Level</label>
                <div className="flex gap-2">
                  {(['fast', 'balanced', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setQualityLevel(level)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        qualityLevel === level
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {qualityLevel === 'fast' && 'Quick generation, basic features'}
                  {qualityLevel === 'balanced' && 'Good balance of speed and quality'}
                  {qualityLevel === 'high' && 'Maximum quality, slower generation'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {options.map((difficulty) => (
            <motion.button
              key={difficulty}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(difficulty)}
              className={`w-full p-6 bg-gradient-to-r ${difficultyColors[difficulty]} rounded-xl text-left font-semibold text-xl shadow-lg hover:shadow-xl transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span>{difficulty}</span>
                  {useRevolutionary && (
                    <div className="text-sm opacity-80 mt-1">
                      🚀 Revolutionary • {useAI ? '🧠 AI-Powered' : '⚡ Enhanced'}
                    </div>
                  )}
                </div>
                <div className="text-sm opacity-80">
                  {difficulty === "Easy" && "★☆☆☆"}
                  {difficulty === "Medium" && "★★☆☆"}
                  {difficulty === "Hard" && "★★★☆"}
                  {difficulty === "Expert" && "★★★★"}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CountdownScreen({ onStart }: { onStart: () => void }) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onStart, 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStart]);

  return (
    <motion.div
      key="countdown"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-black"
    >
      <motion.div
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 1.5, opacity: 0 }}
        className="text-9xl font-bold text-white"
      >
        {count > 0 ? count : "GO!"}
      </motion.div>
    </motion.div>
  );
}

export default function TapTapRevengeStyle() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackData | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("Medium");
  const [selectedStem, setSelectedStem] = useState<Stem>("melody");

  // NEW: Revolutionary chart settings
  const [useRevolutionary, setUseRevolutionary] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const [qualityLevel, setQualityLevel] = useState<"fast" | "balanced" | "high">("balanced");
  const [runMeta, setRunMeta] = useState<{ noteCount: number; runMs: number; chartSeed?: number | null }>({
    noteCount: 0,
    runMs: 0,
    chartSeed: null,
  });
  const [gameStats, setGameStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    accuracy: 0,
  });
  const [runId, setRunId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingTracks(true);
    (async () => {
      try {
        const res = await fetch("/api/stemstation/tracks", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load tracks");
        const next: TrackData[] = (json.tracks || []).map((t: any) => ({
          ...t,
          difficulties: DEFAULT_DIFFICULTIES,
          chartSeed: t.chartSeed ?? t.id?.length ?? 0,
        }));
        if (!cancelled) {
          setTracks(next);
          setTracksError(null);
        }
      } catch (error: any) {
        if (!cancelled) {
          setTracksError(error?.message || "Unable to load STEMSTATION tracks");
          setTracks([]);
        }
      } finally {
        if (!cancelled) setLoadingTracks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (tracks.length && !selectedTrack) {
      setSelectedTrack(tracks[0]);
    }
  }, [tracks, selectedTrack]);

  // Prefetch/generate charts when a song is chosen to avoid in-play generation
  const prewarmCharts = useCallback(async (track: TrackData) => {
    const stems: Stem[] = ["melody", "drums", "vocals"];
    const diffs: Difficulty[] = ["Easy", "Medium", "Hard", "Expert"];
    try {
      await Promise.all(
        stems.flatMap((stem) =>
          diffs.map((diff) => {
            const chartUrl = new URL('/api/stemstation/chart', window.location.origin);
            chartUrl.searchParams.set('trackId', track.id);
            chartUrl.searchParams.set('difficulty', diff.toLowerCase());
            chartUrl.searchParams.set('stem', stem);
            chartUrl.searchParams.set('auto', '1');

            // Add revolutionary parameters for prewarming
            if (useRevolutionary) {
              chartUrl.searchParams.set('revolutionary', 'true');
              chartUrl.searchParams.set('ai', useAI.toString());
              chartUrl.searchParams.set('quality', qualityLevel);
            }

            return fetch(chartUrl.toString(), { cache: "no-store" }).catch(() => null);
          }),
        ),
      );
    } catch {
      // ignore; gameplay fetch will still attempt
    }
  }, []);

  const resetStats = useCallback(() => {
    setGameStats({
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      accuracy: 0,
    });
  }, []);

  // Game state handlers
  const startSongSelect = () => setGameState("songSelect");
  const selectTrack = (track: TrackData) => {
    setSelectedTrack(track);
    setSelectedStem("melody");
    setGameState("difficultySelect");
    resetStats();
    prewarmCharts(track);
  };
  const selectDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulty(difficulty);
    setGameState("countdown");
    resetStats();
  };
  const startGame = () => {
    setRunId(safeRunId());
    setGameState("playing");
  };
  const pauseGame = () => setGameState("paused");
  const resumeGame = () => setGameState("playing");
  const endGame = () => setGameState("results");
  const replay = () => {
    resetStats();
    setGameState("countdown");
  };
  const backToMenu = () => {
    setGameState("menu");
    setSelectedTrack(tracks[0] ?? null);
    resetStats();
    setRunId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white overflow-hidden">
      <AnimatePresence mode="wait">
        {gameState === "menu" && (
          <MainMenu
            onStart={startSongSelect}
            loading={loadingTracks}
            hasTracks={tracks.length > 0}
            error={tracksError}
          />
        )}
        {gameState === "songSelect" && (
          <SongSelect
            tracks={tracks}
            onSelect={selectTrack}
            onBack={backToMenu}
          />
        )}
        {gameState === "difficultySelect" && selectedTrack && (
          <DifficultySelect
            track={selectedTrack}
            onSelect={selectDifficulty}
            onBack={() => setGameState("songSelect")}
            useRevolutionary={useRevolutionary}
            setUseRevolutionary={setUseRevolutionary}
            useAI={useAI}
            setUseAI={setUseAI}
            qualityLevel={qualityLevel}
            setQualityLevel={setQualityLevel}
          />
        )}
        {gameState === "countdown" && (
          <CountdownScreen onStart={startGame} />
        )}
        {["playing", "paused"].includes(gameState) && selectedTrack && (
          <GameplayScreen
            track={selectedTrack}
            difficulty={selectedDifficulty}
            stem={selectedStem}
            onStemChange={setSelectedStem}
            paused={gameState === "paused"}
            onPause={pauseGame}
            onResume={resumeGame}
            onEnd={endGame}
            onComplete={(payload) => {
              setGameStats(payload.stats);
              setRunMeta(payload.meta);
            }}
            runId={runId}
            onReplay={replay}
            onSongSelect={() => setGameState("songSelect")}
            onMainMenu={backToMenu}
          />
        )}
        {gameState === "results" && selectedTrack && (
          <ResultsScreen
            track={selectedTrack}
            difficulty={selectedDifficulty}
            stats={gameStats}
            runMeta={runMeta}
            runId={runId}
            onReplay={replay}
            onBack={backToMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Gameplay Screen Component
function GameplayScreen({
  track,
  difficulty,
  stem,
  onStemChange,
  paused,
  onPause,
  onResume,
  onEnd,
  onComplete,
  runId,
  onReplay,
  onSongSelect,
  onMainMenu,
}: {
  track: TrackData;
  difficulty: Difficulty;
  stem: Stem;
  onStemChange: (stem: Stem) => void;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onComplete: (payload: { stats: GameStats; meta: { noteCount: number; runMs: number; chartSeed?: number | null } }) => void;
  runId: string | null;
  onReplay: () => void;
  onSongSelect: () => void;
  onMainMenu: () => void;
}) {
  const [notes, setNotes] = useState<GameNote[]>([]);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    accuracy: 0,
  });
  const statsRef = useRef<GameStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    accuracy: 0,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [lanePressed, setLanePressed] = useState<boolean[]>([false, false, false, false]);
  const lanePressedRef = useRef<boolean[]>([false, false, false, false]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrame = useRef<number>();
  const gameStartTime = useRef<number>(0);
  const runElapsedRef = useRef<number>(0);
  const endedRef = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offsetMs, setOffsetMs] = useState(0);
  const [lastTiming, setLastTiming] = useState<{ label: string; delta: number } | null>(null);
  const noteTotalRef = useRef<number>(0);
  const activeHoldsRef = useRef<Map<number, { endTime: number }>>(new Map());
  const [chartNotes, setChartNotes] = useState<GameNote[] | null>(null);
  const [chartStatus, setChartStatus] = useState<"idle" | "loading" | "ready" | "error" | "missing">("idle");

  // Mobile-specific state
  const isMobile = useIsMobile();
  const [touchFeedback, setTouchFeedback] = useState<boolean[]>([false, false, false, false]);
  const touchTimeouts = useRef<(NodeJS.Timeout | null)[]>([null, null, null, null]);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showOrientationWarning, setShowOrientationWarning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setChartStatus("loading");
    setChartNotes(null);
    (async () => {
      try {
        // Build revolutionary chart URL with new parameters
        const chartUrl = new URL('/api/stemstation/chart', window.location.origin);
        chartUrl.searchParams.set('trackId', track.id);
        chartUrl.searchParams.set('difficulty', difficulty.toLowerCase());
        chartUrl.searchParams.set('stem', stem);
        chartUrl.searchParams.set('auto', '1');

        // Add revolutionary parameters
        if (useRevolutionary) {
          chartUrl.searchParams.set('revolutionary', 'true');
          chartUrl.searchParams.set('ai', useAI.toString());
          chartUrl.searchParams.set('quality', qualityLevel);
        }

        const res = await fetch(chartUrl.toString(), { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !Array.isArray(json?.notes) || !json.notes.length) {
          if (!cancelled) setChartStatus("missing");
          return;
        }
        const mapped: GameNote[] = json.notes
          .map((n: any, idx: number) => ({
            id: `chart-${track.id}-${difficulty}-${idx}`,
            lane: Number(n.lane ?? 0),
            timeMs: Number(n.timeMs ?? 0),
            type: n.type === "hold" ? "hold" : "tap",
            holdDuration: n.endTimeMs
              ? Math.max(0, Number(n.endTimeMs) - Number(n.timeMs ?? 0))
              : n.durationMs
              ? Math.max(0, Number(n.durationMs))
              : undefined,
          }))
          .filter((n: GameNote) => Number.isFinite(n.timeMs) && n.timeMs >= 0 && n.lane >= 0 && n.lane <= 3);
        if (!cancelled) {
          setChartNotes(mapped);
          setChartStatus("ready");
        }
      } catch (err) {
        console.warn("Chart fetch failed", err);
        if (!cancelled) setChartStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [track.id, difficulty, stem]);

  useEffect(() => {
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    activeHoldsRef.current.clear();

    // Clear touch feedback timeouts
    touchTimeouts.current.forEach(timeout => {
      if (timeout) clearTimeout(timeout);
    });
    touchTimeouts.current = [null, null, null, null];
    setTouchFeedback([false, false, false, false]);

    const baseStats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfect: 0,
      great: 0,
      good: 0,
      miss: 0,
      accuracy: 0,
    };

    if (chartStatus === "loading") {
      setNotes([]);
      setStats(baseStats);
      statsRef.current = baseStats;
      setLastTiming(null);
      setCurrentTime(0);
      endedRef.current = false;
      return;
    }

    const sourceNotes =
      chartNotes && chartStatus === "ready"
        ? chartNotes.map((n) => ({
            ...n,
            timeMs: n.timeMs + offsetMs,
          }))
        : buildChart(track, difficulty, offsetMs);

    noteTotalRef.current = sourceNotes.length;
    setNotes(sourceNotes);
    setStats(baseStats);
    statsRef.current = baseStats;
    setLastTiming(null);
    setCurrentTime(0);
    endedRef.current = false;
    gameStartTime.current = performance.now();
    runElapsedRef.current = 0;
  }, [track, difficulty, stem, runId, offsetMs, chartNotes, chartStatus]);

  const setStatsWithRef = useCallback(
    (updater: (prev: GameStats) => GameStats) => {
      setStats((prev) => {
        const next = updater(prev);
        statsRef.current = next;
        return next;
      });
    },
    [],
  );

  const updateStats = useCallback(
    (judgement: Judgement) => {
      setStatsWithRef((prev) => {
        const nextCombo = judgement === "Miss" ? 0 : prev.combo + 1;
        const updated = {
          ...prev,
          score: prev.score + SCORE_VALUES[judgement],
          combo: judgement === "Miss" ? 0 : nextCombo,
          maxCombo: Math.max(prev.maxCombo, judgement === "Miss" ? prev.combo : nextCombo),
          perfect: prev.perfect + (judgement === "Perfect" ? 1 : 0),
          great: prev.great + (judgement === "Great" ? 1 : 0),
          good: prev.good + (judgement === "Good" ? 1 : 0),
          miss: prev.miss + (judgement === "Miss" ? 1 : 0),
        };
        return { ...updated, accuracy: computeAccuracyFromStats(updated) };
      });
    },
    [setStatsWithRef],
  );

  const markMisses = useCallback(
    (nowMs: number) => {
      if (paused || endedRef.current) return;
      setNotes((prev) => {
        let missed = 0;
        const keep = prev.filter((note) => {
          const timeUntilHit = note.timeMs - nowMs;
          if (timeUntilHit < -HIT_WINDOWS.miss) {
            missed += 1;
            return false;
          }
          return true;
        });
        if (missed > 0) {
          setStatsWithRef((prevStats) => {
            const next = { ...prevStats, miss: prevStats.miss + missed, combo: 0 };
            return { ...next, accuracy: computeAccuracyFromStats(next) };
          });
        }
        return keep;
      });
    },
    [setStatsWithRef, paused],
  );

  const handleEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    if (fallbackTimer.current) {
      clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    onComplete({
      stats: statsRef.current,
      meta: {
        noteCount: noteTotalRef.current,
        runMs: Math.round(runElapsedRef.current),
        chartSeed: track.chartSeed ?? null,
      },
    });
    onEnd();
  }, [onEnd, onComplete, track.chartSeed]);

  const handleEndRef = useRef(handleEnd);
  useEffect(() => {
    handleEndRef.current = handleEnd;
  }, [handleEnd]);

  // Haptic feedback function
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator && isMobile) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30]
      };
      navigator.vibrate(patterns[intensity]);
    }
  }, [isMobile]);

  // Touch feedback visual effect
  const triggerTouchFeedback = useCallback((lane: number) => {
    if (touchTimeouts.current[lane]) {
      clearTimeout(touchTimeouts.current[lane]!);
    }

    setTouchFeedback(prev => {
      const next = [...prev];
      next[lane] = true;
      return next;
    });

    touchTimeouts.current[lane] = setTimeout(() => {
      setTouchFeedback(prev => {
        const next = [...prev];
        next[lane] = false;
        return next;
      });
      touchTimeouts.current[lane] = null;
    }, TOUCH_FEEDBACK_DURATION);
  }, []);

  const hitLane = useCallback(
    (lane: number) => {
      if (paused || endedRef.current) return;

      // Trigger visual and haptic feedback
      triggerTouchFeedback(lane);

      let closest: { note: GameNote | null; diff: number } = { note: null, diff: Infinity };
      notes.forEach((note) => {
        if (note.lane !== lane) return;
        const diff = Math.abs(note.timeMs - currentTime);
        if (diff < closest.diff) {
          closest = { note, diff };
        }
      });

      if (!closest.note || closest.diff > HIT_WINDOWS.miss) {
        updateStats("Miss");
        setLastTiming({ label: "Miss", delta: closest.diff === Infinity ? 0 : closest.diff });
        triggerHapticFeedback('light');
        return;
      }

      const signedDiff = currentTime - closest.note.timeMs;
      const judgement =
        closest.diff <= HIT_WINDOWS.perfect
          ? "Perfect"
          : closest.diff <= HIT_WINDOWS.great
          ? "Great"
          : closest.diff <= HIT_WINDOWS.good
          ? "Good"
          : "Miss";

      updateStats(judgement);
      setLastTiming({ label: judgement, delta: signedDiff });
      setNotes((prev) => prev.filter((n) => n.id !== closest.note?.id));

      // Haptic feedback based on judgement
      const hapticIntensity = judgement === "Perfect" ? 'heavy' : judgement === "Great" ? 'medium' : 'light';
      triggerHapticFeedback(hapticIntensity);

      if (closest.note.type === "hold") {
        const holdDuration = closest.note.holdDuration ?? 0;
        if (holdDuration > 0) {
          activeHoldsRef.current.set(lane, { endTime: closest.note.timeMs + holdDuration });
        }
      }
    },
    [currentTime, notes, updateStats, triggerTouchFeedback, triggerHapticFeedback],
  );

  // Touch event handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent, lane: number) => {
    if (paused || endedRef.current) return;
    e.preventDefault();
    hitLane(lane);
    setLanePressed((prev) => {
      const next = [...prev];
      next[lane] = true;
      lanePressedRef.current = next;
      return next;
    });
  }, [hitLane, paused]);

  const handleTouchEnd = useCallback((lane: number) => {
    setLanePressed((prev) => {
      const next = [...prev];
      next[lane] = false;
      lanePressedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const lane = KEY_BINDINGS[e.code];
      if (lane !== undefined && !paused) {
        e.preventDefault();
        hitLane(lane);
        setLanePressed((prev) => {
          const next = [...prev];
          next[lane] = true;
          lanePressedRef.current = next;
          return next;
        });
      }
      if (e.code === "Escape") {
        e.preventDefault();
        if (paused) onResume();
        else onPause();
      }
      if (e.code === "KeyR") {
        e.preventDefault();
        onReplay();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const lane = KEY_BINDINGS[e.code];
      if (lane !== undefined) {
        setLanePressed((prev) => {
          const next = [...prev];
          next[lane] = false;
          lanePressedRef.current = next;
          return next;
        });
      }
    };

    // Only add keyboard listeners on desktop
    if (!isMobile) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
    }

    return () => {
      if (!isMobile) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, [hitLane, paused, onPause, onResume, onReplay, isMobile]);

  useEffect(() => {
    const audioUrl = track.audioUrl;
    if (!audioUrl || chartStatus === "loading") return;

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.warn("Audio playback failed", err);
    });
    audio.onended = () => handleEndRef.current();
    audio.onerror = () => console.warn("Audio error");

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = null;
    };
  }, [track.audioUrl, runId, chartStatus, stem]);

  useEffect(() => {
    if (chartStatus === "loading") return;

    if (paused || endedRef.current) {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
      return;
    }

    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    }

    const loop = () => {
      const nowMs = audioRef.current
        ? (audioRef.current.currentTime || 0) * 1000
        : performance.now() - gameStartTime.current;

      setCurrentTime(nowMs);
      runElapsedRef.current = nowMs;
      markMisses(nowMs);

      if (activeHoldsRef.current.size) {
        const nextMap = new Map(activeHoldsRef.current);
        nextMap.forEach((info, lane) => {
          const stillHolding = lanePressedRef.current[lane];
          if (!stillHolding && nowMs < info.endTime - HIT_WINDOWS.good) {
            updateStats("Miss");
            nextMap.delete(lane);
          } else if (nowMs >= info.endTime) {
            updateStats("Great");
            nextMap.delete(lane);
          }
        });
        activeHoldsRef.current = nextMap;
      }

      if (audioRef.current?.ended) {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        handleEnd();
        return;
      }
      animationFrame.current = requestAnimationFrame(loop);
    };

    animationFrame.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, [paused, markMisses, handleEnd, chartStatus, stem]);

  // Orientation handling for mobile
  useEffect(() => {
    if (!isMobile) return;

    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const newOrientation = isLandscape ? 'landscape' : 'portrait';
      setOrientation(newOrientation);

      // Show warning if in portrait mode on mobile
      setShowOrientationWarning(newOrientation === 'portrait');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [isMobile]);

  // Performance optimization for mobile
  useEffect(() => {
    if (!isMobile) return;

    // Reduce animation frame rate on mobile for better performance
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    let frameCount = 0;

    window.requestAnimationFrame = (callback) => {
      frameCount++;
      // Skip every other frame on mobile for 30fps instead of 60fps
      if (frameCount % 2 === 0) {
        return originalRequestAnimationFrame(callback);
      } else {
        return originalRequestAnimationFrame(() => {});
      }
    };

    return () => {
      window.requestAnimationFrame = originalRequestAnimationFrame;
    };
  }, [isMobile]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      // Clear all touch timeouts on unmount
      touchTimeouts.current.forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  return (
    <motion.div
      key="gameplay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen bg-black relative overflow-hidden ${isMobile ? 'mobile-device touch-device' : ''}`}
      style={{
        paddingTop: isMobile ? 'env(safe-area-inset-top)' : undefined,
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : undefined,
        paddingLeft: isMobile ? 'env(safe-area-inset-left)' : undefined,
        paddingRight: isMobile ? 'env(safe-area-inset-right)' : undefined,
      }}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent ${isMobile ? 'p-2' : 'p-4'}`}>
        {isMobile ? (
          // Mobile header layout - stacked for better space usage
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{track.title}</h3>
                <p className="text-xs text-gray-400">{difficulty}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{stats.score.toLocaleString()}</div>
                <div className="text-xs">Combo: {stats.combo}</div>
              </div>
              <TouchButton
                onClick={paused ? onResume : onPause}
                variant="secondary"
                size="sm"
                className="text-xs ml-2"
              >
                {paused ? "⏸" : "⏵"}
              </TouchButton>
            </div>
            <div className="flex items-center justify-center gap-1">
              {(['melody','drums','vocals'] as const).map((s) => (
                <TouchButton
                  key={s}
                  onClick={() => onStemChange(s as Stem)}
                  variant={s === stem ? "primary" : "ghost"}
                  size="sm"
                  className="text-xs capitalize px-2 py-1"
                >
                  {s}
                </TouchButton>
              ))}
            </div>
          </div>
        ) : (
          // Desktop header layout - horizontal
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold">{track.title}</h3>
              <p className="text-sm text-gray-400">{difficulty}</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {(['melody','drums','vocals'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onStemChange(s as Stem)}
                  className={`rounded-full border px-2 py-1 capitalize transition-colors ${s === stem ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{stats.score.toLocaleString()}</div>
              <div className="text-sm">Combo: {stats.combo}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={paused ? onResume : onPause}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div
        ref={gameAreaRef}
        className="relative flex"
        style={{ height: isMobile ? MOBILE_LANE_HEIGHT : LANE_HEIGHT }}
      >
        {LANES.map((lane) => {
          const currentHitLineY = isMobile ? MOBILE_HIT_LINE_Y : HIT_LINE_Y;
          const currentLaneHeight = isMobile ? MOBILE_LANE_HEIGHT : LANE_HEIGHT;

          return (
            <div
              key={lane}
              className={`flex-1 relative border-r border-gray-700 ${
                lanePressed[lane] || touchFeedback[lane] ? 'bg-white/20' : 'bg-transparent'
              } transition-colors duration-100`}
              style={{
                backgroundColor: (lanePressed[lane] || touchFeedback[lane]) ? LANE_COLORS[lane] + '40' : 'transparent'
              }}
              onTouchStart={isMobile ? (e) => handleTouchStart(e, lane) : undefined}
              onTouchEnd={isMobile ? () => handleTouchEnd(lane) : undefined}
              onTouchCancel={isMobile ? () => handleTouchEnd(lane) : undefined}
              role={isMobile ? "button" : undefined}
              aria-label={isMobile ? `Lane ${lane + 1} - Tap to hit notes` : undefined}
              tabIndex={isMobile ? 0 : undefined}
            >
              {/* Circular Hit Zone for Mobile */}
              {isMobile && (
                <div
                  className="absolute z-20 rounded-full border-4 border-white/60 flex items-center justify-center"
                  style={{
                    left: '50%',
                    top: currentHitLineY - CIRCULAR_HIT_RADIUS,
                    width: CIRCULAR_HIT_RADIUS * 2,
                    height: CIRCULAR_HIT_RADIUS * 2,
                    transform: 'translateX(-50%)',
                    backgroundColor: (lanePressed[lane] || touchFeedback[lane])
                      ? LANE_COLORS[lane] + '60'
                      : LANE_COLORS[lane] + '20',
                    borderColor: LANE_COLORS[lane],
                    boxShadow: `0 0 20px ${LANE_COLORS[lane]}60`,
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white/80"
                    style={{
                      backgroundColor: (lanePressed[lane] || touchFeedback[lane]) ? 'white' : 'white/60'
                    }}
                  />
                </div>
              )}

              {/* Traditional Hit Line for Desktop */}
              {!isMobile && (
                <div
                  className="absolute left-0 right-0 h-2 bg-white/80 z-10"
                  style={{ top: currentHitLineY }}
                />
              )}

              {/* Notes */}
              {notes
                .filter(note => note.lane === lane)
                .map(note => {
                  const timeUntilHit = note.timeMs - currentTime;
                  const noteY = currentHitLineY - timeUntilHit * NOTE_SPEED;
                  if (noteY < -60 || noteY > currentLaneHeight + 60) return null;

                  const isHold = note.type === "hold" && note.holdDuration;
                  const holdHeight = isHold ? Math.max(16, (note.holdDuration || 0) * NOTE_SPEED + 24) : 48;

                  // Revolutionary note styling
                  const isAdvanced = note.isAdvanced || ['slide', 'chord', 'hammer', 'pull'].includes(note.type);
                  const glowIntensity = note.glowIntensity || (isAdvanced ? 1.5 : 1.0);

                  // Note type specific styling
                  const getNoteStyle = () => {
                    const baseStyle = isMobile ? 'rounded-full' : 'rounded-lg left-2 right-2';

                    switch (note.type) {
                      case 'slide':
                        return `${baseStyle} bg-gradient-to-r from-cyan-400 to-blue-500 border-2 border-cyan-300`;
                      case 'chord':
                        return `${baseStyle} bg-gradient-to-r from-purple-400 to-pink-500 border-2 border-purple-300`;
                      case 'hammer':
                        return `${baseStyle} bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-yellow-300`;
                      case 'pull':
                        return `${baseStyle} bg-gradient-to-r from-green-400 to-emerald-500 border-2 border-green-300`;
                      case 'hold':
                        return `${baseStyle} bg-gradient-to-b from-blue-400 to-blue-600`;
                      default:
                        return `${baseStyle} bg-gradient-to-b from-white to-gray-200`;
                    }
                  };

                  return (
                    <motion.div
                      key={note.id}
                      className={`absolute shadow-lg ${getNoteStyle()}`}
                      style={{
                        filter: `drop-shadow(0 0 ${8 * glowIntensity}px rgba(255, 255, 255, 0.6))`,
                      }}
                      style={{
                        top: noteY,
                        height: isHold ? holdHeight : (isMobile ? 32 : 48),
                        width: isMobile ? 32 : undefined,
                        left: isMobile ? '50%' : undefined,
                        transform: isMobile ? 'translateX(-50%)' : undefined,
                        backgroundColor: note.type === 'tap' ? LANE_COLORS[lane] : undefined,
                        boxShadow: `0 0 ${20 * glowIntensity}px ${LANE_COLORS[lane]}80`
                      }}
                      initial={{ scale: 0.8, opacity: 0.8 }}
                      animate={{
                        scale: isAdvanced ? [1, 1.1, 1] : 1,
                        opacity: 1,
                        rotate: note.type === 'slide' ? [0, 5, -5, 0] : 0
                      }}
                      transition={{
                        scale: { duration: 0.6, repeat: isAdvanced ? Infinity : 0 },
                        rotate: { duration: 1, repeat: note.type === 'slide' ? Infinity : 0 }
                      }}
                    >
                      {/* Revolutionary note content */}
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                        {note.type === 'slide' && (
                          <span className="text-white">
                            {note.slideDirection === 'up' ? '↑' :
                             note.slideDirection === 'down' ? '↓' :
                             note.slideDirection === 'left' ? '←' :
                             note.slideDirection === 'right' ? '→' : '~'}
                          </span>
                        )}
                        {note.type === 'chord' && (
                          <span className="text-white">♫</span>
                        )}
                        {note.type === 'hammer' && (
                          <span className="text-white">H</span>
                        )}
                        {note.type === 'pull' && (
                          <span className="text-white">P</span>
                        )}
                        {note.specialEffect && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </div>
          );
        })}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        {!isMobile && (
          <>
            <div className="flex gap-4 text-sm text-gray-400">
              <span>D</span>
              <span>F</span>
              <span>J</span>
              <span>K</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">Esc: pause • R: restart</div>
          </>
        )}
        {isMobile && (
          <div className="text-xs text-gray-500 mb-2">Tap the circular zones to hit notes</div>
        )}
        <div className="mt-3 text-xs text-gray-400">
          Timing offset: <span className="text-white font-semibold">{offsetMs}ms</span>
        </div>
        <input
          type="range"
          min={-200}
          max={200}
          step={5}
          value={offsetMs}
          onChange={(e) => setOffsetMs(Number(e.currentTarget.value))}
          className={`mt-1 accent-cyan-400 ${isMobile ? 'w-48' : 'w-64'}`}
        />
      </div>

      {chartStatus === "loading" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-4 flex items-center gap-3 shadow-xl shadow-cyan-500/10">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
            <div>
              <div className="text-sm font-semibold">Generating chart & MIDI...</div>
              <div className="text-xs text-gray-300">Auto-mapping before play. Hang tight.</div>
            </div>
          </div>
        </div>
      )}

      {chartStatus === "missing" && (
        <div className="absolute top-16 right-4 z-30 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          Using procedural fallback map
        </div>
      )}

      {chartStatus === "error" && (
        <div className="absolute top-16 right-4 z-30 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">
          Chart load failed, using local generator
        </div>
      )}

      {paused && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className={`w-full rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-black p-6 space-y-4 ${isMobile ? 'max-w-sm mx-4' : 'max-w-md'}`}>
            <div className="text-center">
              <div className="text-sm uppercase tracking-[0.2em] text-gray-400">Paused</div>
              <div className={`font-semibold text-white mt-1 ${isMobile ? 'text-lg' : 'text-xl'}`}>{track.title}</div>
              {!isMobile && <div className="text-xs text-gray-400">Controls: D F J K • Esc toggles pause</div>}
              {isMobile && <div className="text-xs text-gray-400">Tap circular zones to play</div>}
            </div>
            <div className="grid gap-2">
              {isMobile ? (
                <>
                  <TouchButton onClick={onResume} variant="primary" size="lg">
                    Resume
                  </TouchButton>
                  <TouchButton onClick={onReplay} variant="secondary" size="md">
                    Retry Song
                  </TouchButton>
                  <TouchButton onClick={onSongSelect} variant="secondary" size="md">
                    Song Selection
                  </TouchButton>
                  <TouchButton onClick={onMainMenu} variant="ghost" size="md" className="text-red-100 hover:bg-red-500/20">
                    Main Menu
                  </TouchButton>
                </>
              ) : (
                <>
                  <button
                    onClick={onResume}
                    className="rounded-lg bg-white/15 px-4 py-2 text-white font-semibold hover:bg-white/25"
                  >
                    Resume
                  </button>
                  <button
                    onClick={onReplay}
                    className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/15"
                  >
                    Retry Song
                  </button>
                  <button
                    onClick={onSongSelect}
                    className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-white hover:bg-white/15"
                  >
                    Song Selection
                  </button>
                  <button
                    onClick={onMainMenu}
                    className="rounded-lg border border-white/20 bg-red-500/10 px-4 py-2 text-red-100 hover:bg-red-500/20"
                  >
                    Main Menu
                  </button>
                </>
              )}
              <div className="mt-3 text-left text-xs text-gray-400">
                Timing offset ({offsetMs}ms)
                <input
                  type="range"
                  min={-200}
                  max={200}
                  step={5}
                  value={offsetMs}
                  onChange={(e) => setOffsetMs(Number(e.currentTarget.value))}
                  className="mt-1 w-full accent-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {lastTiming && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-4">
          <div
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              lastTiming.label === "Perfect"
                ? "bg-emerald-500/20 text-emerald-100"
                : lastTiming.label === "Great"
                ? "bg-blue-500/20 text-blue-100"
                : lastTiming.label === "Good"
                ? "bg-amber-500/20 text-amber-100"
                : "bg-rose-500/20 text-rose-100"
            }`}
          >
            {lastTiming.label} {Math.round(lastTiming.delta)}ms
          </div>
        </div>
      )}

      {/* Orientation warning for mobile */}
      {isMobile && showOrientationWarning && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="max-w-sm mx-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-amber-100 mb-2">Rotate Your Device</h3>
            <p className="text-sm text-amber-200/80 mb-4">
              For the best Stemstation experience, please rotate your device to landscape mode.
            </p>
            <TouchButton
              onClick={() => setShowOrientationWarning(false)}
              variant="secondary"
              size="sm"
              className="text-amber-100"
            >
              Continue Anyway
            </TouchButton>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Results Screen Component
function ResultsScreen({
  track,
  difficulty,
  stats,
  runMeta,
  runId,
  onReplay,
  onBack
}: {
  track: TrackData;
  difficulty: Difficulty;
  stats: GameStats;
  runMeta: { noteCount: number; runMs: number; chartSeed?: number | null };
  runId: string | null;
  onReplay: () => void;
  onBack: () => void;
}) {
  const totalNotes = stats.perfect + stats.great + stats.good + stats.miss;
  const accuracy = computeAccuracyFromStats(stats);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "pending" | "ok" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const params = new URLSearchParams({
        trackId: track.id,
        difficulty,
        limit: "5",
      });
      const res = await fetch(`/api/tapgame/score?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load leaderboard");
      setLeaderboard(json.entries || []);
    } catch (err: any) {
      setSubmitError(err?.message || "Leaderboard unavailable");
    } finally {
      setLeaderboardLoading(false);
    }
  }, [track.id, difficulty]);

  useEffect(() => {
    let cancelled = false;
    if (!runId) return;
    (async () => {
      try {
        setSubmitStatus("pending");
        setSubmitError(null);
        const payload = {
          gameId: track.id.startsWith("local:") ? "stemstation-local" : track.id,
          trackId: track.id,
          difficulty,
          score: stats.score,
          accuracy,
          maxCombo: stats.maxCombo,
          noteCount: runMeta.noteCount || totalNotes || 0,
          runMs: runMeta.runMs || 0,
          clientHash: `${runId}:${track.id}:${difficulty}`,
        };
        const res = await fetch("/api/tapgame/score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Score submit failed");
        if (!cancelled) setSubmitStatus("ok");
      } catch (err: any) {
        if (!cancelled) {
          setSubmitStatus("error");
          setSubmitError(err?.message || "Score submit failed");
        }
      } finally {
        if (!cancelled) {
          loadLeaderboard();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runId, track.id, difficulty, stats.score, stats.maxCombo, accuracy, loadLeaderboard]);

  return (
    <motion.div
      key="results"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="min-h-screen p-6 flex items-center justify-center"
    >
      <div className="max-w-md w-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-8 text-center">
        <h2 className="text-3xl font-bold mb-2">Results</h2>
        <p className="text-gray-400 mb-6">{track.title} - {difficulty}</p>

        <div className="space-y-4 mb-8">
          <div className="text-4xl font-bold text-yellow-400">
            {stats.score.toLocaleString()}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Max Combo</div>
              <div className="text-xl font-bold">{stats.maxCombo}</div>
            </div>
            <div>
              <div className="text-gray-400">Accuracy</div>
              <div className="text-xl font-bold">{accuracy.toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <div>Notes mapped</div>
              <div className="text-lg font-semibold text-white">{runMeta.noteCount || totalNotes}</div>
            </div>
            <div>
              <div>Run length</div>
              <div className="text-lg font-semibold text-white">
                {runMeta.runMs > 0 ? `${(runMeta.runMs / 1000).toFixed(1)}s` : "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-green-400">Perfect</div>
              <div className="font-bold">{stats.perfect}</div>
            </div>
            <div>
              <div className="text-blue-400">Great</div>
              <div className="font-bold">{stats.great}</div>
            </div>
            <div>
              <div className="text-yellow-400">Good</div>
              <div className="font-bold">{stats.good}</div>
            </div>
            <div>
              <div className="text-red-400">Miss</div>
              <div className="font-bold">{stats.miss}</div>
            </div>
          </div>
        </div>

        <div className="mb-6 space-y-2 text-sm text-left">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Score submit</span>
            <span>
              {submitStatus === "pending" && "Submitting..."}
              {submitStatus === "ok" && "Saved"}
              {submitStatus === "error" && "Failed"}
              {submitStatus === "idle" && "Awaiting"}
            </span>
          </div>
          {submitError && <div className="rounded bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-rose-200">{submitError}</div>}
        </div>

        <div className="mb-6">
          <div className="mb-2 text-left text-sm font-semibold">Leaderboard</div>
          {leaderboardLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading leaderboard...
            </div>
          )}
          {!leaderboardLoading && !leaderboard.length && (
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-400">
              No runs yet. Be the first to set a score.
            </div>
          )}
          {!!leaderboard.length && (
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={`${entry.rank}-${entry.score}`}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">#{entry.rank}</span>
                    <span className="text-white font-semibold">{entry.score.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-400">
                    {entry.accuracy.toFixed(1)}% · {entry.maxCombo}x
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onReplay}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-200"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 bg-gray-700 rounded-full font-semibold hover:bg-gray-600 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </motion.div>
  );
}
