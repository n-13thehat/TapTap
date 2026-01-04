import { create } from 'zustand';
import { Track } from '@/types/track';

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  queue: Track[];
  currentIndex: number;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  isLoading: boolean;
  error: string | null;
}

interface PlayerActions {
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (queue: Track[]) => void;
  setCurrentIndex: (index: number) => void;
  setShuffle: (shuffle: boolean) => void;
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playTrack: (track: Track) => void;
  playQueue: (queue: Track[], startIndex?: number) => void;
}

type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  queue: [],
  currentIndex: -1,
  shuffle: false,
  repeat: 'none',
  isLoading: false,
  error: null,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...initialState,

  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration: duration }),
  setQueue: (queue) => set({ queue }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setShuffle: (shuffle) => set({ shuffle }),
  setRepeat: (repeat) => set({ repeat }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  play: () => {
    const { currentTrack } = get();
    if (currentTrack) {
      set({ isPlaying: true, error: null });
    }
  },

  pause: () => set({ isPlaying: false }),

  next: () => {
    const { queue, currentIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeat === 'all') {
        nextIndex = 0;
      } else {
        return; // End of queue
      }
    }

    const nextTrack = queue[nextIndex];
    set({
      currentTrack: nextTrack,
      currentIndex: nextIndex,
      currentTime: 0,
    });
  },

  previous: () => {
    const { queue, currentIndex, shuffle } = get();
    if (queue.length === 0) return;

    let prevIndex = currentIndex - 1;

    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else if (prevIndex < 0) {
      prevIndex = queue.length - 1;
    }

    const prevTrack = queue[prevIndex];
    set({
      currentTrack: prevTrack,
      currentIndex: prevIndex,
      currentTime: 0,
    });
  },

  seek: (time) => {
    const { duration } = get();
    const clampedTime = Math.max(0, Math.min(time, duration));
    set({ currentTime: clampedTime });
  },

  addToQueue: (track) => {
    const { queue } = get();
    set({ queue: [...queue, track] });
  },

  removeFromQueue: (index) => {
    const { queue, currentIndex } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    let newCurrentIndex = currentIndex;

    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newCurrentIndex = -1;
      set({ currentTrack: null });
    }

    set({ queue: newQueue, currentIndex: newCurrentIndex });
  },

  clearQueue: () => set({ 
    queue: [], 
    currentIndex: -1, 
    currentTrack: null,
    isPlaying: false 
  }),

  playTrack: (track) => {
    set({
      currentTrack: track,
      queue: [track],
      currentIndex: 0,
      currentTime: 0,
      isPlaying: true,
      error: null,
    });
  },

  playQueue: (queue, startIndex = 0) => {
    const track = queue[startIndex];
    set({
      queue,
      currentIndex: startIndex,
      currentTrack: track,
      currentTime: 0,
      isPlaying: true,
      error: null,
    });
  },
}));
