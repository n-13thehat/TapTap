import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Gamepad2, Play, Pause } from 'lucide-react';
import { TapGameTrack, ActiveNote } from '../types';
import { clampAccuracy } from '../utils';
import { Header } from './Header';
import { EmptyState } from './EmptyState';
import { usePlayerStore } from '@/stores/player';
import { isTapGameEnabled } from '@/lib/featureFlagUtils';

const TAPGAME_KEY_LABELS = ["D", "F", "J", "K"];
const TAPGAME_KEYMAP = TAPGAME_KEY_LABELS.map((k) => k.toLowerCase());
const NOTE_TRAVEL_MS = 1800;
const HIT_WINDOW_MS = 220;

function buildTapChart(bpm: number, durationSec: number, seed?: number): { id: string; lane: number }[] {
  const rng = seed ? () => (seed = (seed * 9301 + 49297) % 233280) / 233280 : Math.random;
  const chart: { id: string; lane: number }[] = [];
  const beatMs = 60000 / Math.max(bpm, 60);
  const totalBeats = Math.floor((durationSec * 1000) / beatMs);
  
  for (let i = 0; i < Math.min(totalBeats, 200); i++) {
    if (rng() < 0.6) {
      chart.push({ id: `note_${i}`, lane: Math.floor(rng() * 4) });
    }
  }
  return chart;
}

export function GameSection() {
  const [tracks, setTracks] = useState<TapGameTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<{
    status: "idle" | "playing" | "finished";
    score: number;
    combo: number;
    accuracy: number;
    lastHit: null | "Perfect" | "Great" | "Miss";
  }>({
    status: "idle",
    score: 0,
    combo: 0,
    accuracy: 100,
    lastHit: null,
  });
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const spawnTicker = useRef<number | null>(null);
  const cleanupTimers = useRef<number[]>([]);
  const { queue, addToQueue, playTrack, pause, current } = usePlayerStore((state) => ({
    queue: state.queue,
    addToQueue: state.addToQueue,
    playTrack: state.playTrack,
    pause: state.pause,
    current: state.current,
  }));
  const tapGameEnabled = isTapGameEnabled();

  if (!tapGameEnabled) {
    return (
      <section className="space-y-3">
        <Header icon={<Gamepad2 className="h-4 w-4 text-teal-300" />} title="TapGame" subtitle="Disabled by feature flag" />
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-white/60">
          TapGame/STEMSTATION features are currently turned off. Enable the <code className="text-white">tapGame</code> flag to surface playable charts here.
        </div>
      </section>
    );
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/tapgame/featured");
        if (!res.ok) throw new Error((await res.json()).error || "Failed to load TapGame tracks");
        const json = await res.json();
        if (!cancelled) {
          const next = json.tracks ?? [];
          setTracks(next);
          setActiveTrackId(next[0]?.id ?? null);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "TapGame fetch failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeTrack = tracks.find((t) => t.id === activeTrackId) ?? tracks[0] ?? null;

  const stopGame = useCallback(() => {
    if (spawnTicker.current) {
      clearInterval(spawnTicker.current);
      spawnTicker.current = null;
    }
    cleanupTimers.current.forEach((id) => clearTimeout(id));
    cleanupTimers.current = [];
    // Pause only if we're playing the active TapGame track
    if (current && current.id === activeTrackId) {
      pause();
    }
    setActiveNotes([]);
  }, [activeTrackId, current, pause]);

  useEffect(() => {
    return () => stopGame();
  }, [stopGame]);

  useEffect(() => {
    stopGame();
    setEngine({ status: "idle", score: 0, combo: 0, accuracy: 100, lastHit: null });
  }, [activeTrack?.id, stopGame]);

  const whiff = useCallback(() => {
    setEngine((state) => ({
      ...state,
      combo: 0,
      accuracy: clampAccuracy(state.accuracy * 0.9),
      lastHit: "Miss",
    }));
  }, []);

  const spawnNote = useCallback(
    (note: { id: string; lane: number }) => {
      const spawnAt = performance.now();
      const active: ActiveNote = {
        id: note.id,
        lane: note.lane,
        spawnedAt: spawnAt,
        targetAt: spawnAt + NOTE_TRAVEL_MS,
        status: "flying",
      };
      setActiveNotes((prev) => [...prev, active]);
      const timeoutId = window.setTimeout(() => {
        setActiveNotes((prev) => {
          const existing = prev.find((n) => n.id === note.id);
          if (!existing) return prev;
          if (existing.status === "hit") return prev.filter((n) => n.id !== note.id);
          whiff();
          return prev.filter((n) => n.id !== note.id);
        });
      }, NOTE_TRAVEL_MS + HIT_WINDOW_MS);
      cleanupTimers.current.push(timeoutId);
    },
    [whiff]
  );

  const registerHit = useCallback(
    (lane: number) => {
      setActiveNotes((prev) => {
        const idx = prev.findIndex((note) => note.lane === lane && note.status === "flying");
        if (idx === -1) {
          whiff();
          return prev;
        }
        const note = prev[idx];
        const delta = Math.abs(performance.now() - note.targetAt);
        if (delta > HIT_WINDOW_MS) {
          whiff();
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...note, status: "hit" };
        setEngine((state) => ({
          ...state,
          score: state.score + Math.max(400 - delta, 90),
          combo: state.combo + 1,
          accuracy: clampAccuracy((state.accuracy * 0.8 + 100) / 1.8),
          lastHit: delta < HIT_WINDOW_MS / 2 ? "Perfect" : "Great",
        }));
        return updated;
      });
    },
    [whiff]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const lane = TAPGAME_KEYMAP.indexOf(e.key.toLowerCase());
      if (lane >= 0) {
        e.preventDefault();
        registerHit(lane);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [registerHit]);

  const startGame = useCallback(() => {
    if (!activeTrack) return;
    stopGame();
    const chart = buildTapChart(activeTrack.bpm, activeTrack.duration, activeTrack.chartSeed ?? undefined);
    if (!chart.length) return;
    setEngine({ status: "playing", score: 0, combo: 0, accuracy: 100, lastHit: null });
    setActiveNotes([]);
    if (activeTrack.audioUrl) {
      const normalizedTrack = {
        id: activeTrack.id,
        title: activeTrack.title,
        artist: activeTrack.artist,
        audio_url: activeTrack.audioUrl,
        cover_art: activeTrack.cover,
        duration: activeTrack.duration,
      };
      const exists = queue.find((t) => t.id === activeTrack.id);
      if (!exists) {
        addToQueue(normalizedTrack as any);
      }
      playTrack(normalizedTrack as any);
    }
    const cadence = Math.max(140, 60000 / Math.max(activeTrack.bpm || 120, 60) / 2);
    let idx = 0;
    spawnTicker.current = window.setInterval(() => {
      if (idx >= chart.length) {
        if (spawnTicker.current) {
          clearInterval(spawnTicker.current);
          spawnTicker.current = null;
        }
        const timeoutId = window.setTimeout(() => {
          setEngine((state) => ({ ...state, status: "finished" }));
          audioRef.current?.pause();
        }, NOTE_TRAVEL_MS + 300);
        cleanupTimers.current.push(timeoutId);
        return;
      }
      spawnNote(chart[idx++]);
    }, cadence);
  }, [activeTrack, addToQueue, playTrack, queue, spawnNote, stopGame]);

  const stats = [
    { label: "Score", value: engine.score ? engine.score.toLocaleString() : "0" },
    { label: "Combo", value: engine.combo ? `${engine.combo}x` : "0x" },
    { label: "Accuracy", value: `${engine.accuracy.toFixed(1)}%` },
  ];
  const statusCopy = engine.status === "playing" ? "Live chart" : engine.status === "finished" ? "Run complete" : "Ready";

  if (loading) {
    return (
      <section className="space-y-3">
        <Header icon={<Gamepad2 className="h-4 w-4 text-teal-300" />} title="TapGame" subtitle="Loading interactive charts" />
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">Loading TapGame charts...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <Header icon={<Gamepad2 className="h-4 w-4 text-teal-300" />} title="TapGame" subtitle="Beat battles" />
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">{error}</div>
      </section>
    );
  }

  if (!tracks.length) {
    return (
      <EmptyState
        title="No TapGame songs yet"
        description="Enable TapGame merch when uploading to supply the battle deck."
        action={{ label: "Create TapGame", href: "/creator/upload" }}
      />
    );
  }

  return (
    <section className="space-y-4">
      <Header icon={<Gamepad2 className="h-4 w-4 text-teal-300" />} title="TapGame" subtitle={statusCopy} />
      
      {/* Track Selection */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => setActiveTrackId(track.id)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              track.id === activeTrackId
                ? "border-teal-400/40 bg-teal-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <img src={track.cover} alt={track.title} className="h-12 w-12 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white">{track.title}</div>
                <div className="text-xs text-white/60">{track.artist}</div>
                <div className="text-xs text-white/40">{track.bpm} BPM • {track.difficulty}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Game Interface */}
      {activeTrack && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{activeTrack.title}</h3>
              <p className="text-sm text-white/60">{activeTrack.artist} • {activeTrack.bpm} BPM</p>
            </div>
            <button
              onClick={engine.status === "playing" ? stopGame : startGame}
              className="flex items-center gap-2 rounded-lg bg-teal-500/20 px-4 py-2 text-teal-200 hover:bg-teal-500/30"
            >
              {engine.status === "playing" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {engine.status === "playing" ? "Stop" : "Start"}
            </button>
          </div>

          {/* Stats */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Game Area */}
          <div className="relative h-64 overflow-hidden rounded-lg bg-black/50">
            {/* Lanes */}
            <div className="absolute inset-0 grid grid-cols-4">
              {TAPGAME_KEY_LABELS.map((key, i) => (
                <div key={i} className="border-r border-white/10 last:border-r-0">
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-white/20 px-2 py-1 text-xs text-white">
                    {key}
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            {activeNotes.map((note) => {
              const progress = Math.min(1, (performance.now() - note.spawnedAt) / NOTE_TRAVEL_MS);
              const y = progress * 100;
              return (
                <div
                  key={note.id}
                  className={`absolute h-4 w-1/4 transition-colors ${
                    note.status === "hit" ? "bg-teal-400" : "bg-white/80"
                  }`}
                  style={{
                    left: `${note.lane * 25}%`,
                    top: `${y}%`,
                  }}
                />
              );
            })}

            {/* Hit feedback */}
            {engine.lastHit && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`text-2xl font-bold ${
                  engine.lastHit === "Perfect" ? "text-teal-400" :
                  engine.lastHit === "Great" ? "text-blue-400" : "text-red-400"
                }`}>
                  {engine.lastHit}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-xs text-white/60">
            Use D, F, J, K keys to hit the notes as they reach the bottom
          </div>
        </div>
      )}
    </section>
  );
}
