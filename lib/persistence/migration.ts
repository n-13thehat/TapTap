/**
 * Queue Persistence Migration Utilities
 * Handles migration from legacy localStorage to new IndexedDB persistence
 */

import { Track as PlayerTrack } from '@/stores/player';
import type { Track } from '@/types/track';
import { QueuePersistenceManager } from './queuePersistence';

export interface LegacyQueueData {
  queue: PlayerTrack[];
  index: number;
  shuffle: boolean;
  loop: string;
  volume: number;
}

/**
 * Migration manager for queue persistence
 */
export class QueueMigrationManager {
  private persistenceManager: QueuePersistenceManager;

  constructor(persistenceManager: QueuePersistenceManager) {
    this.persistenceManager = persistenceManager;
  }

  /**
   * Check if migration is needed
   */
  needsMigration(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if legacy localStorage data exists
    const hasLegacyQueue = localStorage.getItem('taptap.player.queue') !== null;
    const hasLegacyIndex = localStorage.getItem('taptap.player.index') !== null;
    
    return hasLegacyQueue || hasLegacyIndex;
  }

  /**
   * Migrate legacy localStorage data to new persistence system
   */
  async migrateLegacyData(): Promise<boolean> {
    if (!this.needsMigration()) {
      console.log('No legacy data to migrate');
      return false;
    }

    try {
      const legacyData = this.loadLegacyData();
      
      if (legacyData && legacyData.queue.length > 0) {
        console.log(`Migrating ${legacyData.queue.length} tracks from legacy storage`);
        
        // Convert loop mode
        const loopMode = legacyData.loop === 'off' ? 'none' : legacyData.loop as 'none' | 'one' | 'all';
        
        // Save to new persistence system
        const normalizedQueue = legacyData.queue.map(track => this.transformLegacyTrack(track));
        
        await this.persistenceManager.saveQueue(
          normalizedQueue,
          legacyData.index,
          false, // Don't restore playing state
          legacyData.shuffle,
          loopMode,
          legacyData.volume
        );

        // Mark migration as complete
        this.markMigrationComplete();
        
        console.log('Legacy queue data migrated successfully');
        return true;
      }
    } catch (error) {
      console.error('Failed to migrate legacy data:', error);
      return false;
    }

    return false;
  }

  /**
   * Load legacy localStorage data
   */
  private loadLegacyData(): LegacyQueueData | null {
    try {
      const queueStr = localStorage.getItem('taptap.player.queue');
      const indexStr = localStorage.getItem('taptap.player.index');
      const shuffleStr = localStorage.getItem('taptap.player.shuffle');
      const loopStr = localStorage.getItem('taptap.player.loop');
      const volumeStr = localStorage.getItem('taptap.player.volume');

      if (!queueStr) return null;

      const queue = JSON.parse(queueStr) as PlayerTrack[];
      const index = Math.max(0, parseInt(indexStr || '0', 10));
      const shuffle = shuffleStr === 'true';
      const loop = loopStr || 'off';
      const volume = Math.min(1, Math.max(0, parseFloat(volumeStr || '0.8')));

      return {
        queue,
        index: Math.min(index, queue.length - 1),
        shuffle,
        loop,
        volume,
      };
    } catch (error) {
      console.error('Failed to load legacy data:', error);
      return null;
    }
  }

  /**
   * Mark migration as complete
   */
  private markMigrationComplete(): void {
    try {
      localStorage.setItem('taptap.queue.migrated', 'true');
      localStorage.setItem('taptap.queue.migration_date', new Date().toISOString());
    } catch (error) {
      console.warn('Failed to mark migration complete:', error);
    }
  }

  /**
   * Check if migration was already completed
   */
  isMigrationComplete(): boolean {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('taptap.queue.migrated') === 'true';
  }

  /**
   * Clean up legacy data after successful migration
   */
  cleanupLegacyData(): void {
    if (typeof window === 'undefined') return;

    try {
      const legacyKeys = [
        'taptap.player.queue',
        'taptap.player.index',
        'taptap.player.shuffle',
        'taptap.player.loop',
        'taptap.player.volume',
      ];

      legacyKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('Legacy queue data cleaned up');
    } catch (error) {
      console.warn('Failed to cleanup legacy data:', error);
    }
  }

  private transformLegacyTrack(track: PlayerTrack): Track {
    return {
      id: track.id,
      title: track.title,
      artistId: track.artist || 'legacy-artist',
      audio_url: track.audio_url,
      cover_art: track.cover_art ?? undefined,
      duration: track.duration ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get migration info
   */
  getMigrationInfo(): {
    needsMigration: boolean;
    isComplete: boolean;
    migrationDate: string | null;
    legacyDataSize: number;
  } {
    const needsMigration = this.needsMigration();
    const isComplete = this.isMigrationComplete();
    const migrationDate = typeof window !== 'undefined' 
      ? localStorage.getItem('taptap.queue.migration_date')
      : null;

    let legacyDataSize = 0;
    if (typeof window !== 'undefined') {
      const legacyData = this.loadLegacyData();
      if (legacyData) {
        legacyDataSize = JSON.stringify(legacyData).length;
      }
    }

    return {
      needsMigration,
      isComplete,
      migrationDate,
      legacyDataSize,
    };
  }

  /**
   * Force migration reset (for testing)
   */
  resetMigration(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('taptap.queue.migrated');
      localStorage.removeItem('taptap.queue.migration_date');
      console.log('Migration reset');
    } catch (error) {
      console.warn('Failed to reset migration:', error);
    }
  }
}
