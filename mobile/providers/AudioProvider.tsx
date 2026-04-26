import { ReactNode, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { AudioContext } from '../hooks/useAudio';

interface Track {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  async function play(track?: Track) {
    try {
      if (track && track.id !== currentTrack?.id) {
        // Load new track
        if (sound) {
          await sound.unloadAsync();
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: track.audioUrl },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setCurrentTrack(track);
        setIsPlaying(true);
      } else if (sound) {
        // Resume current track
        await sound.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play error:', error);
    }
  }

  async function pause() {
    try {
      if (sound) {
        await sound.pauseAsync();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Pause error:', error);
    }
  }

  async function seek(positionMs: number) {
    try {
      if (sound) {
        await sound.setPositionAsync(positionMs);
        setPosition(positionMs);
      }
    } catch (error) {
      console.error('Seek error:', error);
    }
  }

  async function next() {
    // TODO: Implement queue
  }

  async function previous() {
    // TODO: Implement queue
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        position,
        duration,
        play,
        pause,
        seek,
        next,
        previous,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

