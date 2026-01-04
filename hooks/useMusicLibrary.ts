import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/stores/unifiedPlayer';
import { usePlayerStore, type Track as PlayerTrack } from '@/stores/player';

interface UseMusicLibraryOptions {
  autoLoad?: boolean;
  artistId?: string;
  albumId?: string;
  searchQuery?: string;
}

interface MusicLibraryState {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useMusicLibrary(options: UseMusicLibraryOptions = {}) {
  const { autoLoad = true, artistId, albumId, searchQuery } = options;
  
  const [state, setState] = useState<MusicLibraryState>({
    tracks: [],
    loading: false,
    error: null,
    hasMore: true
  });

  const { setQueueList, playTrack: startTrack } = usePlayerStore();

  const toPlayerTrack = useCallback((track: Track): PlayerTrack => {
    const fallbackArtist = (track as any).artist?.stageName || (track as any).artist?.name || (track as any).artist || 'Unknown Artist';
    const cover =
      (track as any).cover_art ||
      (track as any).coverArt ||
      (track as any).cover ||
      (track as any).album?.coverUrl ||
      (track as any).thumbnail;

    const durationSeconds =
      typeof (track as any).duration === 'number'
        ? (track as any).duration
        : (track as any).durationMs
          ? (track as any).durationMs / 1000
          : undefined;

    return {
      id: (track as any).id,
      title: (track as any).title || 'Untitled',
      artist: fallbackArtist,
      album_id: (track as any).album_id ?? (track as any).albumId ?? null,
      audio_url: (track as any).audio_url || (track as any).audioUrl || (track as any).url || '',
      cover_art: cover ?? null,
      duration: durationSeconds ?? null,
    };
  }, []);

  // Load tracks from API
  const loadTracks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams();
      
      if (artistId) params.set('artistId', artistId);
      if (albumId) params.set('albumId', albumId);
      if (searchQuery) params.set('q', searchQuery);

      const response = await fetch(`/api/tracks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load tracks: ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = data.tracks || [];

      setState(prev => ({
        ...prev,
        tracks,
        loading: false,
        hasMore: false // For now, we load all tracks at once
      }));

      return tracks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tracks';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return [];
    }
  }, [artistId, albumId, searchQuery]);

  // Load single track
  const loadTrack = useCallback(async (trackId: string): Promise<Track | null> => {
    try {
      const response = await fetch(`/api/tracks?id=${trackId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load track: ${response.statusText}`);
      }

      const data = await response.json();
      return data.track || null;
    } catch (error) {
      console.error('Failed to load track:', error);
      return null;
    }
  }, []);

  // Play track (add to queue and start playing)
  const playTrack = useCallback((track: Track, trackList?: Track[]) => {
    const queue = trackList || state.tracks;
    const orderedQueue = [track, ...queue.filter(t => t.id !== track.id)];
    const mappedQueue = orderedQueue.map(toPlayerTrack).filter(t => t.audio_url);

    if (mappedQueue.length === 0) {
      console.warn('Track missing audio_url, cannot play:', track.id);
      return;
    }

    setQueueList(mappedQueue);
    startTrack(mappedQueue[0]);
  }, [setQueueList, startTrack, state.tracks, toPlayerTrack]);

  // Play all tracks
  const playAll = useCallback((startIndex = 0) => {
    if (state.tracks.length > 0) {
      const mappedQueue = state.tracks.map(toPlayerTrack).filter(t => t.audio_url);
      if (mappedQueue.length === 0) return;
      const safeIndex = Math.max(0, Math.min(startIndex, mappedQueue.length - 1));
      setQueueList(mappedQueue);
      startTrack(mappedQueue[safeIndex]);
    }
  }, [setQueueList, startTrack, state.tracks, toPlayerTrack]);

  // Add track to queue
  const addToQueue = useCallback((track: Track) => {
    const { addToQueue: addTrackToQueue } = usePlayerStore.getState();
    const mapped = toPlayerTrack(track);
    if (!mapped.audio_url) {
      console.warn('Track missing audio_url, cannot queue:', track.id);
      return;
    }
    addTrackToQueue(mapped);
  }, [toPlayerTrack]);

  // Shuffle and play
  const shuffleAndPlay = useCallback(() => {
    if (state.tracks.length > 0) {
      const shuffled = [...state.tracks].sort(() => Math.random() - 0.5);
      const mappedQueue = shuffled.map(toPlayerTrack).filter(t => t.audio_url);
      if (mappedQueue.length === 0) return;
      setQueueList(mappedQueue);
      startTrack(mappedQueue[0]);
    }
  }, [setQueueList, startTrack, state.tracks, toPlayerTrack]);

  // Search tracks
  const searchTracks = useCallback(async (query: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api/tracks?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      const tracks = data.tracks || [];

      setState(prev => ({
        ...prev,
        tracks,
        loading: false
      }));

      return tracks;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return [];
    }
  }, []);

  // Refresh tracks
  const refresh = useCallback(() => {
    return loadTracks();
  }, [loadTracks]);

  // Auto-load on mount or when dependencies change
  useEffect(() => {
    if (autoLoad) {
      loadTracks();
    }
  }, [autoLoad, loadTracks]);

  return {
    // State
    tracks: state.tracks,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    
    // Actions
    loadTracks,
    loadTrack,
    playTrack,
    playAll,
    addToQueue,
    shuffleAndPlay,
    searchTracks,
    refresh,
    
    // Computed
    isEmpty: state.tracks.length === 0 && !state.loading,
    hasError: !!state.error,
    totalTracks: state.tracks.length
  };
}
