/**
 * Queue Persistence Manager
 * Handles persistent storage of player queue with rehydration and idempotent operations
 */

import { TapTapStorage } from './storage';
import { Track } from '@/types/track';

export interface PersistedQueue {
  id: string;
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  shuffle: boolean;
  loop: 'none' | 'one' | 'all';
  volume: number;
  timestamp: number;
  sessionId: string;
  version: number;
}

export interface QueueOperation {
  id: string;
  type: 'add' | 'remove' | 'reorder' | 'clear' | 'play' | 'pause' | 'skip';
  data: any;
  timestamp: number;
  applied: boolean;
}

/**
 * Queue Persistence Manager
 */
export class QueuePersistenceManager {
  private storage: TapTapStorage;
  private currentQueue: PersistedQueue | null = null;
  private operations: QueueOperation[] = [];
  private sessionId: string;
  private version = 1;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.storage = new TapTapStorage({
      dbName: 'TapTapQueue',
      storeName: 'queue',
      version: 1,
    });
  }

  /**
   * Initialize persistence system
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
    await this.loadPersistedQueue();
    await this.loadPendingOperations();
    console.log('Queue persistence initialized');
  }

  /**
   * Save queue state with idempotent operation
   */
  async saveQueue(
    tracks: Track[],
    currentIndex: number,
    isPlaying: boolean,
    shuffle: boolean,
    loop: 'none' | 'one' | 'all',
    volume: number
  ): Promise<void> {
    const queueId = 'current_queue';
    
    // Create new queue state
    const newQueue: PersistedQueue = {
      id: queueId,
      tracks,
      currentIndex,
      isPlaying,
      shuffle,
      loop,
      volume,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      version: this.version++,
    };

    // Check if this is actually a change (idempotent check)
    if (this.currentQueue && this.isQueueEqual(this.currentQueue, newQueue)) {
      return; // No changes, skip save
    }

    try {
      await this.storage.setItem(queueId, newQueue, { version: newQueue.version });
      this.currentQueue = newQueue;
      console.log(`Queue saved: ${tracks.length} tracks, index ${currentIndex}`);
    } catch (error) {
      console.error('Failed to save queue:', error);
      throw error;
    }
  }

  /**
   * Load persisted queue with rehydration
   */
  async loadQueue(): Promise<PersistedQueue | null> {
    try {
      const stored = await this.storage.getItem('current_queue');
      if (stored && stored.data) {
        const queue = stored.data as PersistedQueue;
        
        // Validate queue integrity
        if (this.validateQueue(queue)) {
          this.currentQueue = queue;
          console.log(`Queue loaded: ${queue.tracks.length} tracks from ${new Date(queue.timestamp).toLocaleString()}`);
          return queue;
        } else {
          console.warn('Loaded queue failed validation, ignoring');
        }
      }
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
    
    return null;
  }

  /**
   * Add idempotent operation to queue
   */
  async addOperation(
    type: QueueOperation['type'],
    data: any
  ): Promise<void> {
    const operation: QueueOperation = {
      id: this.generateOperationId(),
      type,
      data,
      timestamp: Date.now(),
      applied: false,
    };

    this.operations.push(operation);
    
    try {
      await this.storage.setItem(`operation_${operation.id}`, operation);
      console.log(`Queue operation added: ${type}`);
    } catch (error) {
      console.error('Failed to save operation:', error);
    }
  }

  /**
   * Apply pending operations (for rehydration)
   */
  async applyPendingOperations(): Promise<QueueOperation[]> {
    const pendingOps = this.operations.filter(op => !op.applied);
    
    if (pendingOps.length > 0) {
      console.log(`Applying ${pendingOps.length} pending queue operations`);
      
      // Sort by timestamp to ensure correct order
      pendingOps.sort((a, b) => a.timestamp - b.timestamp);
      
      // Mark operations as applied
      for (const op of pendingOps) {
        op.applied = true;
        await this.storage.setItem(`operation_${op.id}`, op);
      }
    }
    
    return pendingOps;
  }

  /**
   * Clear old operations (cleanup)
   */
  async clearOldOperations(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = Date.now() - maxAge;
    const oldOperations = this.operations.filter(op => op.timestamp < cutoff && op.applied);
    
    for (const op of oldOperations) {
      await this.storage.removeItem(`operation_${op.id}`);
    }
    
    this.operations = this.operations.filter(op => op.timestamp >= cutoff || !op.applied);
    console.log(`Cleared ${oldOperations.length} old queue operations`);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    hasPersistedQueue: boolean;
    queueAge: number;
    trackCount: number;
    pendingOperations: number;
    storageInfo: any;
  }> {
    const storageInfo = await this.storage.getStorageInfo();
    
    return {
      hasPersistedQueue: this.currentQueue !== null,
      queueAge: this.currentQueue ? Date.now() - this.currentQueue.timestamp : 0,
      trackCount: this.currentQueue?.tracks.length || 0,
      pendingOperations: this.operations.filter(op => !op.applied).length,
      storageInfo,
    };
  }

  /**
   * Clear all persisted data
   */
  async clearAll(): Promise<void> {
    await this.storage.clear();
    this.currentQueue = null;
    this.operations = [];
    console.log('All queue persistence data cleared');
  }

  // Private helper methods
  private async loadPersistedQueue(): Promise<void> {
    await this.loadQueue();
  }

  private async loadPendingOperations(): Promise<void> {
    try {
      const allItems = await this.storage.getAllItems();
      this.operations = allItems
        .filter(item => item.id.startsWith('operation_'))
        .map(item => item.data as QueueOperation);
      
      console.log(`Loaded ${this.operations.length} queue operations`);
    } catch (error) {
      console.error('Failed to load operations:', error);
    }
  }

  private isQueueEqual(queue1: PersistedQueue, queue2: PersistedQueue): boolean {
    return (
      queue1.tracks.length === queue2.tracks.length &&
      queue1.currentIndex === queue2.currentIndex &&
      queue1.isPlaying === queue2.isPlaying &&
      queue1.shuffle === queue2.shuffle &&
      queue1.loop === queue2.loop &&
      queue1.volume === queue2.volume &&
      queue1.tracks.every((track, index) => track.id === queue2.tracks[index]?.id)
    );
  }

  private validateQueue(queue: PersistedQueue): boolean {
    return (
      queue &&
      Array.isArray(queue.tracks) &&
      typeof queue.currentIndex === 'number' &&
      typeof queue.isPlaying === 'boolean' &&
      queue.currentIndex >= 0 &&
      queue.currentIndex < queue.tracks.length &&
      queue.tracks.every(track => track && track.id && track.title)
    );
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
