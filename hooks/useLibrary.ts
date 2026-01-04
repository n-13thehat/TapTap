"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { LibraryManager } from '@/lib/library/libraryManager';
import { Track } from '@/types/track';
import { 
  Playlist, 
  SmartPlaylist, 
  LibraryFilter, 
  SortOption, 
  LibraryStats,
  SmartPlaylistRule 
} from '@/lib/library/types';
import { useAuth } from './useAuth';

/**
 * Hook for library management
 */
export function useLibrary() {
  const { user } = useAuth();
  const libraryManager = useRef<LibraryManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize library manager
  useEffect(() => {
    if (user?.id && !libraryManager.current) {
      libraryManager.current = new LibraryManager(user.id);
      setIsLoaded(true);
    }
  }, [user?.id]);

  const addTrack = useCallback(async (track: Track, metadata?: Record<string, any>) => {
    if (!libraryManager.current) return;
    await libraryManager.current.addTrack(track, metadata);
  }, []);

  const removeTrack = useCallback(async (trackId: string) => {
    if (!libraryManager.current) return;
    await libraryManager.current.removeTrack(trackId);
  }, []);

  const createPlaylist = useCallback(async (
    name: string,
    description?: string,
    isPublic = false,
    tracks: Track[] = []
  ) => {
    if (!libraryManager.current) return null;
    return await libraryManager.current.createPlaylist(name, description, isPublic, tracks);
  }, []);

  const createSmartPlaylist = useCallback(async (
    name: string,
    rules: SmartPlaylistRule[],
    sortBy: SortOption,
    maxTracks = 100
  ) => {
    if (!libraryManager.current) return null;
    return await libraryManager.current.createSmartPlaylist(name, rules, sortBy, maxTracks);
  }, []);

  const filterTracks = useCallback((filter: LibraryFilter, sort?: SortOption) => {
    if (!libraryManager.current) return [];
    return libraryManager.current.filterTracks(filter, sort);
  }, []);

  const getAllTracks = useCallback(() => {
    if (!libraryManager.current) return [];
    return libraryManager.current.getAllTracks();
  }, []);

  const getAllPlaylists = useCallback(() => {
    if (!libraryManager.current) return [];
    return libraryManager.current.getAllPlaylists();
  }, []);

  const getPlaylist = useCallback((id: string) => {
    if (!libraryManager.current) return undefined;
    return libraryManager.current.getPlaylist(id);
  }, []);

  const toggleFavorite = useCallback(async (trackId: string) => {
    if (!libraryManager.current) return false;
    return await libraryManager.current.toggleFavorite(trackId);
  }, []);

  const incrementPlayCount = useCallback(async (trackId: string) => {
    if (!libraryManager.current) return;
    await libraryManager.current.incrementPlayCount(trackId);
  }, []);

  const getStats = useCallback(() => {
    if (!libraryManager.current) return null;
    return libraryManager.current.getStats();
  }, []);

  return {
    isLoaded,
    addTrack,
    removeTrack,
    createPlaylist,
    createSmartPlaylist,
    filterTracks,
    getAllTracks,
    getAllPlaylists,
    getPlaylist,
    toggleFavorite,
    incrementPlayCount,
    getStats,
  };
}

/**
 * Hook for filtered library view
 */
export function useLibraryView(initialFilter?: LibraryFilter, initialSort?: SortOption) {
  const { filterTracks, isLoaded } = useLibrary();
  const [filter, setFilter] = useState<LibraryFilter>(initialFilter || {});
  const [sort, setSort] = useState<SortOption>(initialSort || { field: 'addedAt', direction: 'desc' });
  const [tracks, setTracks] = useState<Track[]>([]);

  // Update tracks when filter or sort changes
  useEffect(() => {
    if (isLoaded) {
      const filteredTracks = filterTracks(filter, sort);
      setTracks(filteredTracks);
    }
  }, [filter, sort, isLoaded, filterTracks]);

  const updateFilter = useCallback((newFilter: Partial<LibraryFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const updateSort = useCallback((newSort: SortOption) => {
    setSort(newSort);
  }, []);

  return {
    tracks,
    filter,
    sort,
    updateFilter,
    clearFilter,
    updateSort,
    isLoaded,
  };
}

/**
 * Hook for playlist management
 */
export function usePlaylistManager() {
  const { getAllPlaylists, createPlaylist, createSmartPlaylist, isLoaded } = useLibrary();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  // Load playlists
  useEffect(() => {
    if (isLoaded) {
      setPlaylists(getAllPlaylists());
    }
  }, [isLoaded, getAllPlaylists]);

  const refreshPlaylists = useCallback(() => {
    if (isLoaded) {
      setPlaylists(getAllPlaylists());
    }
  }, [isLoaded, getAllPlaylists]);

  const handleCreatePlaylist = useCallback(async (
    name: string,
    description?: string,
    isPublic = false,
    tracks: Track[] = []
  ) => {
    const playlist = await createPlaylist(name, description, isPublic, tracks);
    if (playlist) {
      refreshPlaylists();
    }
    return playlist;
  }, [createPlaylist, refreshPlaylists]);

  const handleCreateSmartPlaylist = useCallback(async (
    name: string,
    rules: SmartPlaylistRule[],
    sortBy: SortOption,
    maxTracks = 100
  ) => {
    const smartPlaylist = await createSmartPlaylist(name, rules, sortBy, maxTracks);
    if (smartPlaylist) {
      refreshPlaylists();
    }
    return smartPlaylist;
  }, [createSmartPlaylist, refreshPlaylists]);

  return {
    playlists,
    createPlaylist: handleCreatePlaylist,
    createSmartPlaylist: handleCreateSmartPlaylist,
    refreshPlaylists,
    isLoaded,
  };
}

/**
 * Hook for library statistics
 */
export function useLibraryStats() {
  const { getStats, isLoaded } = useLibrary();
  const [stats, setStats] = useState<LibraryStats | null>(null);

  useEffect(() => {
    if (isLoaded) {
      const libraryStats = getStats();
      setStats(libraryStats);
    }
  }, [isLoaded, getStats]);

  const refreshStats = useCallback(() => {
    if (isLoaded) {
      const libraryStats = getStats();
      setStats(libraryStats);
    }
  }, [isLoaded, getStats]);

  return {
    stats,
    refreshStats,
    isLoaded,
  };
}
