import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover?: string;
  audioUrl: string;
  duration?: number;
  storageKey?: string;
  mimeType?: string;
}

export interface PlayerState {
  // Current playback
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  
  // Queue management
  queue: Track[];
  currentIndex: number;
  originalQueue: Track[]; // For shuffle mode
  
  // Playback modes
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  
  // UI state
  showQueue: boolean;
  showLyrics: boolean;
  showVisualizer: boolean;
  isExpanded: boolean;
  
  // Error handling
  error: string | null;
}

export interface PlayerActions {
  // Playback controls
  play: (track?: Track) => void;
  pause: () => void;
  togglePlayPause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  
  // Volume controls
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Queue management
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  shuffleQueue: () => void;
  
  // Playback modes
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setRepeat: (mode: 'off' | 'one' | 'all') => void;
  
  // UI controls
  toggleQueue: () => void;
  toggleLyrics: () => void;
  toggleVisualizer: () => void;
  toggleExpanded: () => void;
  
  // State updates
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsLoading: (loading: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setError: (error: string | null) => void;
}

export type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  isLoading: false,
  isBuffering: false,
  queue: [],
  currentIndex: -1,
  originalQueue: [],
  shuffle: false,
  repeat: 'off',
  showQueue: false,
  showLyrics: false,
  showVisualizer: false,
  isExpanded: false,
  error: null,
};

export const useUnifiedPlayer = create<PlayerStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Playback controls
      play: (track?: Track) => {
        set((state) => {
          if (track) {
            // Play specific track
            const trackIndex = state.queue.findIndex(t => t.id === track.id);
            if (trackIndex !== -1) {
              state.currentIndex = trackIndex;
              state.currentTrack = track;
            } else {
              // Add to queue if not found
              state.queue.push(track);
              state.currentIndex = state.queue.length - 1;
              state.currentTrack = track;
            }
          }
          state.isPlaying = true;
          state.error = null;
        });
      },

      pause: () => {
        set((state) => {
          state.isPlaying = false;
        });
      },

      togglePlayPause: () => {
        const { isPlaying, currentTrack } = get();
        if (currentTrack) {
          if (isPlaying) {
            get().pause();
          } else {
            get().play();
          }
        }
      },

      next: () => {
        set((state) => {
          const { queue, currentIndex, repeat, shuffle } = state;
          if (queue.length === 0) return;

          let nextIndex = currentIndex + 1;
          
          if (repeat === 'one') {
            // Stay on current track
            return;
          } else if (repeat === 'all' && nextIndex >= queue.length) {
            nextIndex = 0;
          } else if (nextIndex >= queue.length) {
            // End of queue
            state.isPlaying = false;
            return;
          }

          state.currentIndex = nextIndex;
          state.currentTrack = queue[nextIndex];
          state.currentTime = 0;
        });
      },

      previous: () => {
        set((state) => {
          const { queue, currentIndex, currentTime } = state;
          if (queue.length === 0) return;

          // If more than 3 seconds into track, restart current track
          if (currentTime > 3) {
            state.currentTime = 0;
            return;
          }

          let prevIndex = currentIndex - 1;
          if (prevIndex < 0) {
            if (state.repeat === 'all') {
              prevIndex = queue.length - 1;
            } else {
              return; // Can't go back further
            }
          }

          state.currentIndex = prevIndex;
          state.currentTrack = queue[prevIndex];
          state.currentTime = 0;
        });
      },

      seek: (time: number) => {
        set((state) => {
          state.currentTime = Math.max(0, Math.min(time, state.duration));
        });
      },

      // Volume controls
      setVolume: (volume: number) => {
        set((state) => {
          state.volume = Math.max(0, Math.min(1, volume));
          if (volume > 0) {
            state.isMuted = false;
          }
        });
      },

      toggleMute: () => {
        set((state) => {
          state.isMuted = !state.isMuted;
        });
      },

      // Queue management
      setQueue: (tracks: Track[], startIndex = 0) => {
        set((state) => {
          state.queue = [...tracks];
          state.originalQueue = [...tracks];
          state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
          state.currentTrack = tracks[state.currentIndex] || null;
          state.currentTime = 0;
        });
      },

      addToQueue: (track: Track) => {
        set((state) => {
          state.queue.push(track);
          if (!state.currentTrack) {
            state.currentTrack = track;
            state.currentIndex = 0;
          }
        });
      },

      removeFromQueue: (trackId: string) => {
        set((state) => {
          const index = state.queue.findIndex(t => t.id === trackId);
          if (index === -1) return;

          state.queue.splice(index, 1);
          
          if (index < state.currentIndex) {
            state.currentIndex--;
          } else if (index === state.currentIndex) {
            // Removed current track
            if (state.queue.length === 0) {
              state.currentTrack = null;
              state.currentIndex = -1;
              state.isPlaying = false;
            } else {
              // Play next track or wrap to beginning
              const nextIndex = Math.min(state.currentIndex, state.queue.length - 1);
              state.currentIndex = nextIndex;
              state.currentTrack = state.queue[nextIndex];
              state.currentTime = 0;
            }
          }
        });
      },

      reorderQueue: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const { queue } = state;
          if (fromIndex < 0 || fromIndex >= queue.length || toIndex < 0 || toIndex >= queue.length) {
            return;
          }

          const [movedTrack] = queue.splice(fromIndex, 1);
          queue.splice(toIndex, 0, movedTrack);

          // Update current index if needed
          if (state.currentIndex === fromIndex) {
            state.currentIndex = toIndex;
          } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
            state.currentIndex--;
          } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
            state.currentIndex++;
          }
        });
      },

      clearQueue: () => {
        set((state) => {
          state.queue = [];
          state.originalQueue = [];
          state.currentTrack = null;
          state.currentIndex = -1;
          state.isPlaying = false;
          state.currentTime = 0;
        });
      },

      shuffleQueue: () => {
        set((state) => {
          if (state.queue.length <= 1) return;

          const currentTrack = state.currentTrack;
          const shuffled = [...state.queue];
          
          // Fisher-Yates shuffle
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          state.queue = shuffled;
          
          // Update current index to match current track
          if (currentTrack) {
            state.currentIndex = shuffled.findIndex(t => t.id === currentTrack.id);
          }
        });
      },

      // Playback modes
      toggleShuffle: () => {
        set((state) => {
          state.shuffle = !state.shuffle;
          
          if (state.shuffle) {
            // Enable shuffle - save original queue and shuffle
            state.originalQueue = [...state.queue];
            get().shuffleQueue();
          } else {
            // Disable shuffle - restore original queue
            const currentTrack = state.currentTrack;
            state.queue = [...state.originalQueue];
            
            if (currentTrack) {
              state.currentIndex = state.queue.findIndex(t => t.id === currentTrack.id);
            }
          }
        });
      },

      toggleRepeat: () => {
        set((state) => {
          switch (state.repeat) {
            case 'off':
              state.repeat = 'all';
              break;
            case 'all':
              state.repeat = 'one';
              break;
            case 'one':
              state.repeat = 'off';
              break;
          }
        });
      },

      setRepeat: (mode: 'off' | 'one' | 'all') => {
        set((state) => {
          state.repeat = mode;
        });
      },

      // UI controls
      toggleQueue: () => {
        set((state) => {
          state.showQueue = !state.showQueue;
        });
      },

      toggleLyrics: () => {
        set((state) => {
          state.showLyrics = !state.showLyrics;
        });
      },

      toggleVisualizer: () => {
        set((state) => {
          state.showVisualizer = !state.showVisualizer;
        });
      },

      toggleExpanded: () => {
        set((state) => {
          state.isExpanded = !state.isExpanded;
        });
      },

      // State updates
      setCurrentTime: (time: number) => {
        set((state) => {
          state.currentTime = time;
        });
      },

      setDuration: (duration: number) => {
        set((state) => {
          state.duration = duration;
        });
      },

      setIsLoading: (loading: boolean) => {
        set((state) => {
          state.isLoading = loading;
        });
      },

      setIsBuffering: (buffering: boolean) => {
        set((state) => {
          state.isBuffering = buffering;
        });
      },

      setError: (error: string | null) => {
        set((state) => {
          state.error = error;
        });
      },
    }))
  )
);
