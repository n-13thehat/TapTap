import { useState, useEffect, createContext, useContext } from 'react';
import { Audio } from 'expo-av';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
}

interface AudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  play: (track?: Track) => Promise<void>;
  pause: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    // Return mock data for development
    return {
      currentTrack: null,
      isPlaying: false,
      position: 0,
      duration: 0,
      play: async () => {},
      pause: async () => {},
      seek: async () => {},
      next: async () => {},
      previous: async () => {},
    };
  }
  return context;
}

export { AudioContext };

