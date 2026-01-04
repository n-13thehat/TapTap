import { useState, useEffect, useCallback } from 'react';
import { Track } from '@/stores/unifiedPlayer';

interface FeaturedPlaylist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  trackCount: number;
  creator: string;
  featured: boolean;
  free: boolean;
  tracks: Array<{
    id: string;
    title: string;
    artist: string;
    duration?: number;
  }>;
}

interface FeaturedArtist {
  name: string;
  bio: string;
  trackCount: number;
  verified: boolean;
}

interface FeaturedAlbum {
  title: string;
  artist: string;
  trackCount: number;
  description: string;
}

interface FeaturedContent {
  tracks: Track[];
  playlists: FeaturedPlaylist[];
  featured: {
    artist: FeaturedArtist;
    album: FeaturedAlbum;
  } | null;
}

interface UseFeaturedContentState {
  content: FeaturedContent;
  loading: boolean;
  error: string | null;
}

export function useFeaturedContent() {
  const [state, setState] = useState<UseFeaturedContentState>({
    content: {
      tracks: [],
      playlists: [],
      featured: null
    },
    loading: false,
    error: null
  });

  // Load featured content from API
  const loadFeaturedContent = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch('/api/featured');
      
      if (!response.ok) {
        throw new Error(`Failed to load featured content: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        content: {
          tracks: data.tracks || [],
          playlists: data.playlists || [],
          featured: data.featured || null
        },
        loading: false
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load featured content';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return null;
    }
  }, []);

  // Auto-load on mount
  useEffect(() => {
    loadFeaturedContent();
  }, [loadFeaturedContent]);

  return {
    // State
    tracks: state.content.tracks,
    playlists: state.content.playlists,
    featuredArtist: state.content.featured?.artist,
    featuredAlbum: state.content.featured?.album,
    loading: state.loading,
    error: state.error,
    
    // Actions
    refresh: loadFeaturedContent,
    
    // Computed
    isEmpty: state.content.tracks.length === 0 && !state.loading,
    hasError: !!state.error,
    totalTracks: state.content.tracks.length,
    totalPlaylists: state.content.playlists.length
  };
}
