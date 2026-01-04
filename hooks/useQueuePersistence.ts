"use client";

import { useEffect, useCallback, useRef } from 'react';
import { QueuePersistenceManager, PersistedQueue } from '@/lib/persistence/queuePersistence';
import { Track } from '@/types/track';

/**
 * Hook for queue persistence with automatic save/load
 */
export function useQueuePersistence() {
  const persistenceManager = useRef<QueuePersistenceManager | null>(null);
  const isInitialized = useRef(false);

  // Initialize persistence manager
  useEffect(() => {
    const initPersistence = async () => {
      if (!isInitialized.current) {
        persistenceManager.current = new QueuePersistenceManager();
        await persistenceManager.current.initialize();
        isInitialized.current = true;
      }
    };

    initPersistence().catch(console.error);
  }, []);

  /**
   * Save queue state
   */
  const saveQueue = useCallback(async (
    tracks: Track[],
    currentIndex: number,
    isPlaying: boolean,
    shuffle: boolean,
    loop: 'none' | 'one' | 'all',
    volume: number
  ) => {
    if (!persistenceManager.current) return;

    try {
      await persistenceManager.current.saveQueue(
        tracks,
        currentIndex,
        isPlaying,
        shuffle,
        loop,
        volume
      );
    } catch (error) {
      console.error('Failed to save queue:', error);
    }
  }, []);

  /**
   * Load persisted queue
   */
  const loadQueue = useCallback(async (): Promise<PersistedQueue | null> => {
    if (!persistenceManager.current) return null;

    try {
      return await persistenceManager.current.loadQueue();
    } catch (error) {
      console.error('Failed to load queue:', error);
      return null;
    }
  }, []);

  /**
   * Add idempotent operation
   */
  const addOperation = useCallback(async (
    type: 'add' | 'remove' | 'reorder' | 'clear' | 'play' | 'pause' | 'skip',
    data: any
  ) => {
    if (!persistenceManager.current) return;

    try {
      await persistenceManager.current.addOperation(type, data);
    } catch (error) {
      console.error('Failed to add operation:', error);
    }
  }, []);

  /**
   * Apply pending operations
   */
  const applyPendingOperations = useCallback(async () => {
    if (!persistenceManager.current) return [];

    try {
      return await persistenceManager.current.applyPendingOperations();
    } catch (error) {
      console.error('Failed to apply pending operations:', error);
      return [];
    }
  }, []);

  /**
   * Get queue statistics
   */
  const getQueueStats = useCallback(async () => {
    if (!persistenceManager.current) return null;

    try {
      return await persistenceManager.current.getQueueStats();
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }, []);

  /**
   * Clear all persisted data
   */
  const clearAll = useCallback(async () => {
    if (!persistenceManager.current) return;

    try {
      await persistenceManager.current.clearAll();
    } catch (error) {
      console.error('Failed to clear persistence data:', error);
    }
  }, []);

  /**
   * Cleanup old operations
   */
  const cleanup = useCallback(async (maxAge?: number) => {
    if (!persistenceManager.current) return;

    try {
      await persistenceManager.current.clearOldOperations(maxAge);
    } catch (error) {
      console.error('Failed to cleanup operations:', error);
    }
  }, []);

  return {
    saveQueue,
    loadQueue,
    addOperation,
    applyPendingOperations,
    getQueueStats,
    clearAll,
    cleanup,
    isReady: isInitialized.current,
  };
}

/**
 * Hook for automatic queue persistence
 */
export function useAutoQueuePersistence(
  tracks: Track[],
  currentIndex: number,
  isPlaying: boolean,
  shuffle: boolean,
  loop: 'none' | 'one' | 'all',
  volume: number,
  enabled = true
) {
  const { saveQueue, isReady } = useQueuePersistence();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save queue state with debouncing
  useEffect(() => {
    if (!enabled || !isReady) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce saves to avoid excessive writes
    saveTimeoutRef.current = setTimeout(() => {
      saveQueue(tracks, currentIndex, isPlaying, shuffle, loop, volume);
    }, 1000); // 1 second debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [tracks, currentIndex, isPlaying, shuffle, loop, volume, enabled, isReady, saveQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
}
