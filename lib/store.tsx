import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { UUID } from '../types/global';
import type { TrackWithArtist } from '../types/api';
import { getTrackDuration } from './adapters/trackAdapter';

// ============================================================================
// Player State Types
// ============================================================================

export interface PlaybackState {
  status: 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  buffered: TimeRanges | null;
  error: string | null;
}

export interface QueueState {
  tracks: TrackWithArtist[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  history: TrackWithArtist[];
}

export interface PlayerPreferences {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  crossfade: boolean;
  gapless: boolean;
  normalizeVolume: boolean;
  showVisualizer: boolean;
  visualizerType: 'bars' | 'circle' | 'wave' | 'particles';
}

export interface PlayerState {
  // Current track and playback
  currentTrack: TrackWithArtist | null;
  playback: PlaybackState;
  queue: QueueState;
  preferences: PlayerPreferences;

  // UI state
  showPlayer: boolean;
  showQueue: boolean;
  showLyrics: boolean;
  showVisualizer: boolean;

  // Audio context
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
}

export interface PlayerActions {
  // Playback controls
  play: (track?: TrackWithArtist) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;

  // Queue management
  addToQueue: (tracks: TrackWithArtist | TrackWithArtist[], position?: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  skipToTrack: (index: number) => void;
  shuffleQueue: () => void;

  // Preferences
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  setCrossfade: (crossfade: boolean) => void;
  setGapless: (gapless: boolean) => void;
  setNormalizeVolume: (normalize: boolean) => void;

  // UI controls
  togglePlayer: () => void;
  toggleQueue: () => void;
  toggleLyrics: () => void;
  toggleVisualizer: () => void;

  // Audio setup
  initializeAudio: () => Promise<void>;
  destroyAudio: () => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Utility
  reset: () => void;

  // Legacy compatibility
  playTrack: (track: TrackWithArtist) => Promise<void>;
  setQueueList: (tracks: TrackWithArtist[]) => void;
}

type PlayerStore = PlayerState & PlayerActions;

// ============================================================================
// Default State
// ============================================================================

const defaultPlaybackState: PlaybackState = {
  status: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  muted: false,
  playbackRate: 1,
  buffered: null,
  error: null,
};

const defaultQueueState: QueueState = {
  tracks: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 'none',
  history: [],
};

const defaultPreferences: PlayerPreferences = {
  volume: 0.8,
  muted: false,
  shuffle: false,
  repeat: 'none',
  crossfade: false,
  gapless: true,
  normalizeVolume: false,
  showVisualizer: false,
  visualizerType: 'bars',
};

const defaultPlayerState: PlayerState = {
  currentTrack: null,
  playback: defaultPlaybackState,
  queue: defaultQueueState,
  preferences: defaultPreferences,
  showPlayer: false,
  showQueue: false,
  showLyrics: false,
  showVisualizer: false,
  audioContext: null,
  audioElement: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const usePlayerStore = create<PlayerStore>()(subscribeWithSelector(immer((set, get) => ({
  ...defaultPlayerState,

  // Playback controls
  play: async (track?: TrackWithArtist) => {
    const state = get();

    try {
      set((draft) => {
        draft.playback.status = 'loading';
        draft.playback.error = null;
      });

      if (track) {
        // Play new track
        set((draft) => {
          draft.currentTrack = track;
          draft.playback.currentTime = 0;
          draft.playback.duration = getTrackDuration(track);
        });

        // Add to queue if not already there
        const currentQueue = get().queue.tracks;
        const trackIndex = currentQueue.findIndex(t => t.id === track.id);

        if (trackIndex === -1) {
          set((draft) => {
            draft.queue.tracks.push(track);
            draft.queue.currentIndex = draft.queue.tracks.length - 1;
          });
        } else {
          set((draft) => {
            draft.queue.currentIndex = trackIndex;
          });
        }
      }

      // Initialize audio if needed
      if (!state.audioElement) {
        await get().initializeAudio();
      }

      set((draft) => {
        draft.playback.status = 'playing';
        draft.showPlayer = true;
      });

    } catch (error) {
      set((draft) => {
        draft.playback.status = 'error';
        draft.playback.error = error instanceof Error ? error.message : 'Playback failed';
      });
    }
  },

  pause: () => {
    set((draft) => {
      draft.playback.status = 'paused';
    });
  },

  stop: () => {
    set((draft) => {
      draft.playback.status = 'idle';
      draft.playback.currentTime = 0;
    });
  },

  seek: (time: number) => {
    set((draft) => {
      draft.playback.currentTime = Math.max(0, Math.min(time, draft.playback.duration));
    });
  },

  setVolume: (volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    set((draft) => {
      draft.playback.volume = clampedVolume;
      draft.preferences.volume = clampedVolume;
      if (clampedVolume > 0) {
        draft.playback.muted = false;
        draft.preferences.muted = false;
      }
    });
  },

  setMuted: (muted: boolean) => {
    set((draft) => {
      draft.playback.muted = muted;
      draft.preferences.muted = muted;
    });
  },

  setPlaybackRate: (rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate));
    set((draft) => {
      draft.playback.playbackRate = clampedRate;
    });
  },

  // Queue management
  addToQueue: (tracks: TrackWithArtist | TrackWithArtist[], position?: number) => {
    const tracksArray = Array.isArray(tracks) ? tracks : [tracks];

    set((draft) => {
      if (typeof position === 'number') {
        draft.queue.tracks.splice(position, 0, ...tracksArray);
      } else {
        draft.queue.tracks.push(...tracksArray);
      }
    });
  },

  removeFromQueue: (index: number) => {
    set((draft) => {
      if (index >= 0 && index < draft.queue.tracks.length) {
        draft.queue.tracks.splice(index, 1);

        // Adjust current index if needed
        if (index < draft.queue.currentIndex) {
          draft.queue.currentIndex--;
        } else if (index === draft.queue.currentIndex) {
          // Current track was removed
          if (draft.queue.tracks.length === 0) {
            draft.currentTrack = null;
            draft.queue.currentIndex = -1;
            draft.playback.status = 'idle';
          } else {
            // Play next track or wrap to beginning
            const nextIndex = Math.min(draft.queue.currentIndex, draft.queue.tracks.length - 1);
            draft.queue.currentIndex = nextIndex;
            draft.currentTrack = draft.queue.tracks[nextIndex];
          }
        }
      }
    });
  },

  clearQueue: () => {
    set((draft) => {
      draft.queue.tracks = [];
      draft.queue.currentIndex = -1;
      draft.currentTrack = null;
      draft.playback.status = 'idle';
    });
  },

  skipToNext: () => {
    const state = get();
    const { tracks, currentIndex, repeat, shuffle } = state.queue;

    if (tracks.length === 0) return;

    let nextIndex: number;

    if (repeat === 'one') {
      nextIndex = currentIndex;
    } else if (shuffle) {
      // Random next track (excluding current)
      const availableIndices = tracks.map((_, i) => i).filter(i => i !== currentIndex);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)] ?? 0;
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= tracks.length) {
        nextIndex = repeat === 'all' ? 0 : currentIndex;
      }
    }

    if (nextIndex !== currentIndex && tracks[nextIndex]) {
      get().skipToTrack(nextIndex);
    }
  },

  skipToPrevious: () => {
    const state = get();
    const { tracks, currentIndex, shuffle, history } = state.queue;

    if (tracks.length === 0) return;

    // If we're more than 3 seconds into the track, restart it
    if (state.playback.currentTime > 3) {
      get().seek(0);
      return;
    }

    let prevIndex: number;

    if (shuffle && history.length > 0) {
      // Go back in shuffle history
      const lastTrack = history[history.length - 1];
      prevIndex = tracks.findIndex(t => t.id === lastTrack.id);
      if (prevIndex === -1) prevIndex = Math.max(0, currentIndex - 1);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = tracks.length - 1;
      }
    }

    if (tracks[prevIndex]) {
      get().skipToTrack(prevIndex);
    }
  },

  skipToTrack: (index: number) => {
    const state = get();
    const track = state.queue.tracks[index];

    if (track) {
      set((draft) => {
        // Add current track to history if shuffling
        if (draft.queue.shuffle && draft.currentTrack) {
          draft.queue.history.push(draft.currentTrack);
          // Keep history to reasonable size
          if (draft.queue.history.length > 50) {
            draft.queue.history.shift();
          }
        }

        draft.currentTrack = track;
        draft.queue.currentIndex = index;
        draft.playback.currentTime = 0;
        draft.playback.duration = getTrackDuration(track);
      });

      // Auto-play if currently playing
      if (state.playback.status === 'playing') {
        get().play();
      }
    }
  },

  shuffleQueue: () => {
    set((draft) => {
      const currentTrack = draft.currentTrack;
      const tracks = [...draft.queue.tracks];

      // Fisher-Yates shuffle
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }

      draft.queue.tracks = tracks;

      // Update current index to match current track
      if (currentTrack) {
        const newIndex = tracks.findIndex(t => t.id === currentTrack.id);
        draft.queue.currentIndex = newIndex !== -1 ? newIndex : 0;
      }
    });
  },

  // Preferences
  setShuffle: (shuffle: boolean) => {
    set((draft) => {
      draft.queue.shuffle = shuffle;
      draft.preferences.shuffle = shuffle;

      if (shuffle) {
        // Clear history when enabling shuffle
        draft.queue.history = [];
      }
    });
  },

  setRepeat: (repeat: 'none' | 'one' | 'all') => {
    set((draft) => {
      draft.queue.repeat = repeat;
      draft.preferences.repeat = repeat;
    });
  },

  setCrossfade: (crossfade: boolean) => {
    set((draft) => {
      draft.preferences.crossfade = crossfade;
    });
  },

  setGapless: (gapless: boolean) => {
    set((draft) => {
      draft.preferences.gapless = gapless;
    });
  },

  setNormalizeVolume: (normalize: boolean) => {
    set((draft) => {
      draft.preferences.normalizeVolume = normalize;
    });
  },

  // UI controls
  togglePlayer: () => {
    set((draft) => {
      draft.showPlayer = !draft.showPlayer;
    });
  },

  toggleQueue: () => {
    set((draft) => {
      draft.showQueue = !draft.showQueue;
    });
  },

  toggleLyrics: () => {
    set((draft) => {
      draft.showLyrics = !draft.showLyrics;
    });
  },

  toggleVisualizer: () => {
    set((draft) => {
      draft.showVisualizer = !draft.showVisualizer;
    });
  },

  // Audio setup
  initializeAudio: async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioElement = new Audio();

      // Configure audio element
      audioElement.crossOrigin = 'anonymous';
      audioElement.preload = 'metadata';

      set((state) => ({
        ...state,
        audioContext: audioContext,
        audioElement: audioElement,
      }));

    } catch (error) {
      set((draft) => {
        draft.playback.error = 'Failed to initialize audio';
      });
    }
  },

  destroyAudio: () => {
    const state = get();

    if (state.audioElement) {
      state.audioElement.pause();
      state.audioElement.src = '';
    }

    if (state.audioContext && state.audioContext.state !== 'closed') {
      state.audioContext.close();
    }

    set((draft) => {
      draft.audioContext = null;
      draft.audioElement = null;
    });
  },

  // Error handling
  setError: (error: string | null) => {
    set((draft) => {
      draft.playback.error = error;
      if (error) {
        draft.playback.status = 'error';
      }
    });
  },

  clearError: () => {
    set((draft) => {
      draft.playback.error = null;
      if (draft.playback.status === 'error') {
        draft.playback.status = 'idle';
      }
    });
  },

  // Utility
  reset: () => {
    get().destroyAudio();
    set(() => ({ ...defaultPlayerState }));
  },

  // Legacy compatibility
  playTrack: (track: TrackWithArtist) => get().play(track),
  setQueueList: (tracks: TrackWithArtist[]) => {
    set((draft) => {
      draft.queue.tracks = tracks;
      if (tracks.length > 0 && draft.queue.currentIndex === -1) {
        draft.queue.currentIndex = 0;
        draft.currentTrack = tracks[0];
      }
    });
  },
}))));

// ============================================================================
// Selectors
// ============================================================================

export const selectCurrentTrack = (state: PlayerStore) => state.currentTrack;
export const selectPlaybackStatus = (state: PlayerStore) => state.playback.status;
export const selectIsPlaying = (state: PlayerStore) => state.playback.status === 'playing';
export const selectQueue = (state: PlayerStore) => state.queue.tracks;
export const selectCurrentIndex = (state: PlayerStore) => state.queue.currentIndex;
export const selectVolume = (state: PlayerStore) => state.playback.volume;
export const selectMuted = (state: PlayerStore) => state.playback.muted;
export const selectShuffle = (state: PlayerStore) => state.queue.shuffle;
export const selectRepeat = (state: PlayerStore) => state.queue.repeat;
export const selectProgress = (state: PlayerStore) => {
  const { currentTime, duration } = state.playback;
  return duration > 0 ? currentTime / duration : 0;
};

// ============================================================================
// Persistence
// ============================================================================

// Save preferences to localStorage
usePlayerStore.subscribe(
  (state) => state.preferences,
  (preferences) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taptap-player-preferences', JSON.stringify(preferences));
    }
  },
  { equalityFn: (a, b) => JSON.stringify(a) === JSON.stringify(b) }
);

// Load preferences from localStorage on initialization
if (typeof window !== 'undefined') {
  const savedPreferences = localStorage.getItem('taptap-player-preferences');
  if (savedPreferences) {
    try {
      const preferences = JSON.parse(savedPreferences);
      usePlayerStore.setState((state) => ({
        ...state,
        preferences: { ...defaultPreferences, ...preferences },
        playback: {
          ...state.playback,
          volume: preferences.volume ?? defaultPreferences.volume,
          muted: preferences.muted ?? defaultPreferences.muted,
        },
        queue: {
          ...state.queue,
          shuffle: preferences.shuffle ?? defaultPreferences.shuffle,
          repeat: preferences.repeat ?? defaultPreferences.repeat,
        },
      }));
    } catch (error) {
      console.warn('Failed to load player preferences:', error);
    }
  }
}