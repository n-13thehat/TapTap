"use client";
import { create } from "zustand";
import { checkHavenPolicy, logPolicyViolation } from "@/lib/havenPolicy";
import { eventBus, EventTypes } from "@/lib/eventBus";
import {
  QueuePersistenceManager,
  type QueueOperation,
} from "@/lib/persistence/queuePersistence";
import type { Track as PersistedTrack } from "@/types/track";
import { normalizeTrack, getTrackUrl, getTrackDuration } from "@/lib/adapters/trackAdapter";

export type Track = {
  id: string;
  title: string;
  artist?: string | null;
  album_id?: string | null;
  audio_url: string;
  cover_art?: string | null;
  duration?: number | null;
};

const mapTrackToPersisted = (track: Track): PersistedTrack => ({
  id: track.id,
  title: track.title,
  artistId: track.artist || "legacy-artist",
  audio_url: track.audio_url,
  cover_art: track.cover_art ?? undefined,
  duration: track.duration ?? undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const mapPersistedTrackToPlayer = (track: PersistedTrack): Track => {
  const normalized = normalizeTrack(track);
  return {
    id: normalized.id,
    title: normalized.title,
    artist: normalized.artist?.stageName || null,
    album_id: normalized.albumId || null,
    audio_url: getTrackUrl(normalized),
    cover_art: normalized.album?.coverUrl || normalized.artist?.avatarUrl || null,
    duration: getTrackDuration(normalized),
  };
};

type LoopMode = "off" | "one" | "all";

type PlayerState = {
  queue: Track[];
  current: Track | null;
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  loop: LoopMode;
  volume: number;
  lyricsOpen: boolean;

  // Persistence
  persistenceManager: QueuePersistenceManager | null;
  isHydrated: boolean;

  setQueueList: (tracks: Track[]) => void;
  addToQueue: (t: Track) => void;
  addNext: (t: Track) => void;
  playTrack: (t: Track) => void;
  play: () => void;
  pause: () => void;
  skipNext: () => void;
  skipPrev: () => void;
  toggleShuffle: () => void;
  cycleLoop: () => void;
  setVolume: (v: number) => void;
  toggleLyrics: () => void;
  saveTrack: (trackId: string) => Promise<void>;
  addToPlaylist: (trackId: string, playlistId?: string) => Promise<void>;
  createQuickPlaylist: (trackId: string, name?: string) => Promise<void>;

  // Persistence actions
  initializePersistence: () => Promise<void>;
  loadPersistedQueue: () => Promise<void>;
  saveQueueState: () => Promise<void>;
  clearPersistedData: () => Promise<void>;
};

const LS_Q = "taptap.player.queue";
const LS_I = "taptap.player.index";
const LS_S = "taptap.player.shuffle";
const LS_L = "taptap.player.loop";
const LS_V = "taptap.player.volume";

function clampIndex(value: number, tracksLength: number) {
  if (tracksLength <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(value, tracksLength - 1));
}

function applyQueueOperationsToState(
  tracks: Track[],
  currentIndex: number,
  operations: QueueOperation[]
) {
  if (!operations.length) {
    return { tracks, currentIndex };
  }

  let nextTracks = [...tracks];
  let nextIndex = clampIndex(currentIndex, nextTracks.length);

  for (const op of operations) {
    const data = op.data || {};

    switch (op.type) {
      case "add": {
        const track = data.track as Track | undefined;
        if (!track) break;

        nextTracks = nextTracks.filter((existing) => existing.id !== track.id);
        let position =
          typeof data.position === "number" ? data.position : nextTracks.length;
        position = Math.max(0, Math.min(position, nextTracks.length));
        nextTracks = [
          ...nextTracks.slice(0, position),
          track,
          ...nextTracks.slice(position),
        ];
        if (position <= nextIndex) {
          nextIndex += 1;
        }
        break;
      }
      case "remove": {
        const trackId: string | undefined = data.trackId ?? data.id;
        if (!trackId) break;
        const idx = nextTracks.findIndex((existing) => existing.id === trackId);
        if (idx >= 0) {
          nextTracks = [
            ...nextTracks.slice(0, idx),
            ...nextTracks.slice(idx + 1),
          ];
          if (idx < nextIndex) {
            nextIndex = Math.max(0, nextIndex - 1);
          } else if (idx === nextIndex) {
            nextIndex = clampIndex(nextIndex, nextTracks.length);
          }
        }
        break;
      }
      case "clear": {
        nextTracks = [];
        nextIndex = 0;
        break;
      }
      case "reorder": {
        const order: string[] = Array.isArray(data.order) ? data.order : [];
        if (!order.length) break;

        const idToTrack = new Map(nextTracks.map((track) => [track.id, track]));
        const reordered: Track[] = [];
        order.forEach((trackId) => {
          const track = idToTrack.get(trackId);
          if (track) reordered.push(track);
        });
        nextTracks.forEach((track) => {
          if (!order.includes(track.id)) reordered.push(track);
        });
        const currentId = nextTracks[nextIndex]?.id;
        nextTracks = reordered;
        if (currentId) {
          const replacementIdx = nextTracks.findIndex(
            (track) => track.id === currentId
          );
          nextIndex =
            replacementIdx >= 0
              ? replacementIdx
              : clampIndex(nextIndex, nextTracks.length);
        } else {
          nextIndex = clampIndex(nextIndex, nextTracks.length);
        }
        break;
      }
      case "skip":
      case "play": {
        if (typeof data.targetIndex === "number") {
          nextIndex = clampIndex(data.targetIndex, nextTracks.length);
        } else if (data.trackId) {
          const idx = nextTracks.findIndex(
            (track) => track.id === data.trackId
          );
          if (idx >= 0) {
            nextIndex = idx;
          }
        }
        break;
      }
      default:
        break;
    }
  }

  nextIndex = clampIndex(nextIndex, nextTracks.length);
  if (!nextTracks.length) {
    nextIndex = 0;
  }

  return {
    tracks: nextTracks,
    currentIndex: nextIndex,
  };
}

function loadLS<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    if (key === LS_Q) return JSON.parse(v) as T;
    if (key === LS_V) return (Number(v) as unknown) as T;
    return (v as unknown) as T;
  } catch (error) {
    console.warn(`Failed to load from localStorage key "${key}":`, error);
    return fallback;
  }
}

function saveLS(key: string, v: any) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, key === LS_Q ? JSON.stringify(v) : String(v));
  } catch (error) {
    console.warn(`Failed to save to localStorage key "${key}":`, error);
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => {
  const initialQueue = loadLS<Track[]>(LS_Q, []);
  const initialIndex = Math.max(0, Number(loadLS<string>(LS_I, "0")) || 0);
  const initialShuffle = loadLS<string>(LS_S, "false") === "true";
  const initialLoop = (loadLS<string>(LS_L, "off") as LoopMode) ?? "off";
  const initialVolume = Math.min(
    1,
    Math.max(0, Number(loadLS<number>(LS_V, 0.8)))
  );

  const current =
    initialQueue.length > 0
      ? initialQueue[Math.min(initialIndex, initialQueue.length - 1)]
      : null;

  function persist() {
    const { queue, index, shuffle, loop, volume, persistenceManager } = get();

    // Legacy localStorage persistence (for backward compatibility)
    saveLS(LS_Q, queue);
    saveLS(LS_I, index);
    saveLS(LS_S, shuffle);
    saveLS(LS_L, loop);
    saveLS(LS_V, volume);

    // New persistence manager (async, non-blocking)
    if (persistenceManager) {
      const persistLoop = loop === 'off' ? 'none' : loop;
      const normalizedQueue = queue.map(mapTrackToPersisted);
      persistenceManager.saveQueue(
        normalizedQueue,
        index,
        false, // isPlaying - don't persist playing state for auto-saves
        shuffle,
        persistLoop as 'none' | 'one' | 'all',
        volume
      ).catch(console.error);
    }
  }

  const recordQueueOperation = (
    type: QueueOperation["type"],
    data: Record<string, any>
  ) => {
    const manager = get().persistenceManager;
    if (!manager) return;
    manager.addOperation(type, data).catch((error) => {
      console.error("Failed to record queue operation:", error);
    });
  };

  return {
    queue: initialQueue,
    current,
    index: Math.min(initialIndex, Math.max(0, initialQueue.length - 1)),
    isPlaying: false,
    shuffle: initialShuffle,
    loop: initialLoop,
    volume: initialVolume,
    lyricsOpen: false,

    // Persistence state
    persistenceManager: null,
    isHydrated: false,

    setQueueList: (tracks) => {
      set({ queue: tracks, index: 0, current: tracks[0] ?? null });
      persist();
      recordQueueOperation("reorder", { order: tracks.map((track) => track.id) });
    },

    addToQueue: (t) => {
      const q = [...get().queue, t];
      set({ queue: q });
      persist();
      recordQueueOperation("add", { track: t, position: q.length - 1 });
    },

    addNext: (t) => {
      const { queue, index } = get();
      const position = Math.min(index + 1, queue.length);
      const q = [...queue];
      q.splice(position, 0, t);
      set({ queue: q });
      persist();
      recordQueueOperation("add", { track: t, position });
    },

    playTrack: (t) => {
      // Haven policy check
      const policyResult = checkHavenPolicy({
        id: t.id,
        type: 'track',
        title: t.title,
        metadata: { artist: t.artist }
      });

      if (!policyResult.allowed) {
        logPolicyViolation({
          id: t.id,
          type: 'track',
          title: t.title,
          metadata: { artist: t.artist }
        }, policyResult);

        console.warn(`Track blocked by Haven policy: ${policyResult.reason}`);
        return;
      }

      const q = get().queue;
      const idx = q.findIndex((x) => x.id === t.id);
      set({ current: t, index: idx >= 0 ? idx : 0, isPlaying: true });

      // Emit event bus events
      eventBus.emit(EventTypes.TRACK_PLAYED, {
        trackId: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration,
        queuePosition: idx,
        queueSize: q.length,
        policyCheck: policyResult,
      }).catch(console.error);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("taptap:play", { detail: { track: t, queue: q } })
        );
        // Enhanced event with policy check result
        window.dispatchEvent(
          new CustomEvent("taptap:track-played", {
            detail: {
              trackId: t.id,
              title: t.title,
              artist: t.artist,
              policyCheck: policyResult,
              timestamp: Date.now()
            }
          })
        );
      }
      persist();
      recordQueueOperation("play", {
        trackId: t.id,
        targetIndex: idx >= 0 ? idx : 0,
      });
    },

    play: () => {
      const current = get().current;
      set({ isPlaying: true });

      if (current) {
        eventBus.emit(EventTypes.TRACK_PLAYED, {
          trackId: current.id,
          title: current.title,
          artist: current.artist,
          resumed: true,
        }).catch(console.error);
      }
    },
    pause: () => {
      const current = get().current;
      set({ isPlaying: false });

      if (current) {
        eventBus.emit(EventTypes.TRACK_PAUSED, {
          trackId: current.id,
          title: current.title,
          artist: current.artist,
          // TODO: Add current position when available
          position: 0,
        }).catch(console.error);
      }
    },

    skipNext: () => {
      const { queue, index, loop, shuffle } = get();
      if (queue.length === 0) return;
      let nextIndex = index;
      if (shuffle) {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else if (index < queue.length - 1) {
        nextIndex = index + 1;
      } else if (loop === "all") {
        nextIndex = 0;
      } else if (loop === "one") {
        nextIndex = index;
      } else {
        set({ isPlaying: false });
        return;
      }
      const next = queue[nextIndex];
      const current = get().current;

      // Emit skip event for current track
      if (current) {
        eventBus.emit(EventTypes.TRACK_SKIPPED, {
          trackId: current.id,
          title: current.title,
          artist: current.artist,
          position: 0, // TODO: Add actual position
        }).catch(console.error);
      }

      set({ current: next, index: nextIndex, isPlaying: true });

      // Emit play event for next track
      if (next) {
        eventBus.emit(EventTypes.TRACK_PLAYED, {
          trackId: next.id,
          title: next.title,
          artist: next.artist,
          skipped: true,
        }).catch(console.error);
      }

      persist();
      recordQueueOperation("skip", {
        direction: "next",
        fromId: current?.id,
        toId: next?.id,
        targetIndex: nextIndex,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("taptap:play", { detail: { track: next, queue } })
        );
      }
    },

    skipPrev: () => {
      const { queue, index, loop, shuffle } = get();
      if (queue.length === 0) return;
      let prevIndex = index;
      if (shuffle) {
        prevIndex = Math.floor(Math.random() * queue.length);
      } else if (index > 0) {
        prevIndex = index - 1;
      } else if (loop === "all") {
        prevIndex = queue.length - 1;
      } else if (loop === "one") {
        prevIndex = index;
      } else {
        set({ isPlaying: false });
        return;
      }
      const prev = queue[prevIndex];
      const current = get().current;
      set({ current: prev, index: prevIndex, isPlaying: true });
      persist();
      recordQueueOperation("skip", {
        direction: "prev",
        fromId: current?.id,
        toId: prev?.id,
        targetIndex: prevIndex,
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("taptap:play", { detail: { track: prev, queue } })
        );
      }
    },

    toggleShuffle: () => {
      set({ shuffle: !get().shuffle });
      persist();
    },

    cycleLoop: () => {
      const order: LoopMode[] = ["off", "one", "all"];
      const idx = order.indexOf(get().loop);
      set({ loop: order[(idx + 1) % order.length] });
      persist();
    },

    setVolume: (v: number) => {
      set({ volume: Math.min(1, Math.max(0, v)) });
      persist();
    },

    toggleLyrics: () => set({ lyricsOpen: !get().lyricsOpen }),

    saveTrack: async (trackId: string) => {
      try {
        const response = await fetch('/api/tracks/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId })
        });

        if (response.ok) {
          // Emit event for analytics
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("taptap:track-saved", { detail: { trackId } })
            );
          }
        }
      } catch (error) {
        console.error('Failed to save track:', error);
      }
    },

    addToPlaylist: async (trackId: string, playlistId?: string) => {
      try {
        const response = await fetch('/api/playlists/add-track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId, playlistId })
        });

        if (response.ok) {
          // Emit event for analytics
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("taptap:track-added-to-playlist", {
                detail: { trackId, playlistId }
              })
            );
          }
        }
      } catch (error) {
        console.error('Failed to add track to playlist:', error);
      }
    },

    createQuickPlaylist: async (trackId: string, name?: string) => {
      try {
        const response = await fetch('/api/playlists/quick-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackId,
            name: name || `Quick Playlist ${new Date().toLocaleDateString()}`
          })
        });

        if (response.ok) {
          const data = await response.json();
          // Emit event for analytics
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("taptap:playlist-created", {
                detail: { playlistId: data.playlist?.id, trackId, quickAdd: true }
              })
            );
          }
        }
      } catch (error) {
        console.error('Failed to create quick playlist:', error);
      }
    },

    // Persistence methods
    initializePersistence: async () => {
      try {
        const manager = new QueuePersistenceManager();
        await manager.initialize();
        set({ persistenceManager: manager });
        console.log('Queue persistence initialized');
      } catch (error) {
        console.error('Failed to initialize persistence:', error);
      }
    },

    loadPersistedQueue: async () => {
      const { persistenceManager } = get();
      if (!persistenceManager) return;

      try {
        const persistedQueue = await persistenceManager.loadQueue();
        if (persistedQueue) {
          // Apply pending operations first
          const pendingOps = await persistenceManager.applyPendingOperations();
          console.log(`Applied ${pendingOps.length} pending operations`);

          let hydratedTracks = persistedQueue.tracks.map(mapPersistedTrackToPlayer);
          let hydratedIndex = persistedQueue.currentIndex;

          if (pendingOps.length) {
            const applied = applyQueueOperationsToState(
              hydratedTracks,
              hydratedIndex,
              pendingOps
            );
            hydratedTracks = applied.tracks;
            hydratedIndex = applied.currentIndex;

            // Persist the reconciled state for future loads
            try {
              await persistenceManager.saveQueue(
                hydratedTracks.map(mapTrackToPersisted),
                hydratedIndex,
                persistedQueue.isPlaying,
                persistedQueue.shuffle,
                persistedQueue.loop,
                persistedQueue.volume
              );
            } catch (saveError) {
              console.warn("Failed to persist reconciled queue state:", saveError);
            }
          }

          // Convert loop mode
          const loopMode =
            persistedQueue.loop === "none" ? "off" : persistedQueue.loop;

          set({
            queue: hydratedTracks,
            current: hydratedTracks[hydratedIndex] || null,
            index: hydratedIndex,
            isPlaying: persistedQueue.isPlaying,
            shuffle: persistedQueue.shuffle,
            loop: loopMode as LoopMode,
            volume: persistedQueue.volume,
            isHydrated: true,
          });

          console.log(`Queue rehydrated: ${hydratedTracks.length} tracks`);
        } else {
          set({ isHydrated: true });
        }
      } catch (error) {
        console.error('Failed to load persisted queue:', error);
        set({ isHydrated: true });
      }
    },

    saveQueueState: async () => {
      const { persistenceManager, queue, index, isPlaying, shuffle, loop, volume } = get();
      if (!persistenceManager) return;

      try {
        // Convert loop mode
        const persistLoop = loop === 'off' ? 'none' : loop;

        const normalizedQueue = queue.map(mapTrackToPersisted);
        await persistenceManager.saveQueue(
          normalizedQueue,
          index,
          isPlaying,
          shuffle,
          persistLoop as 'none' | 'one' | 'all',
          volume
        );
      } catch (error) {
        console.error('Failed to save queue state:', error);
      }
    },

    clearPersistedData: async () => {
      const { persistenceManager } = get();
      if (!persistenceManager) return;

      try {
        await persistenceManager.clearAll();
        console.log('Persisted queue data cleared');
      } catch (error) {
        console.error('Failed to clear persisted data:', error);
      }
    },
  };
});
