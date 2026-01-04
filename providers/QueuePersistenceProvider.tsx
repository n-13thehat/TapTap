"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePlayerStore } from '@/stores/player';
import { QueueMigrationManager } from '@/lib/persistence/migration';

type QueueStats = {
  hasPersistedQueue: boolean;
  queueAge: number;
  trackCount: number;
  pendingOperations: number;
  storageInfo: any;
};

interface QueuePersistenceContextType {
  isInitialized: boolean;
  isHydrated: boolean;
  stats: QueueStats | null;
}

const QueuePersistenceContext = createContext<QueuePersistenceContextType | null>(null);

interface QueuePersistenceProviderProps {
  children: React.ReactNode;
}

export function QueuePersistenceProvider({ children }: QueuePersistenceProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [stats, setStats] = useState<QueueStats | null>(null);

  const {
    initializePersistence,
    loadPersistedQueue,
    isHydrated,
    persistenceManager,
  } = usePlayerStore();

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized) return;

    const initPersistence = async () => {
      try {
        // Initialize persistence manager
        await initializePersistence();

        // Get the updated persistence manager from store
        const { persistenceManager: updatedManager } = usePlayerStore.getState();

        // Handle migration from legacy localStorage
        if (updatedManager) {
          const migrationManager = new QueueMigrationManager(updatedManager);

          if (migrationManager.needsMigration() && !migrationManager.isMigrationComplete()) {
            console.log('Migrating legacy queue data...');
            const migrated = await migrationManager.migrateLegacyData();

            if (migrated) {
              // Clean up legacy data after successful migration
              migrationManager.cleanupLegacyData();
            }
          }
        }

        // Load persisted queue
        await loadPersistedQueue();

        setIsInitialized(true);
        console.log('Queue persistence provider initialized');
      } catch (error) {
        console.error('Failed to initialize queue persistence:', error);
        setIsInitialized(true); // Still mark as initialized to prevent blocking
      }
    };

    initPersistence();
  }, []); // Empty dependency array to run only once

  // Update stats periodically
  useEffect(() => {
    if (!persistenceManager) return;

    const updateStats = async () => {
      try {
        const queueStats = await persistenceManager.getQueueStats();
        setStats(queueStats);
      } catch (error) {
        console.error('Failed to get queue stats:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [persistenceManager]);

  // Cleanup old operations periodically
  useEffect(() => {
    if (!persistenceManager) return;

    const cleanup = async () => {
      try {
        await persistenceManager.clearOldOperations();
      } catch (error) {
        console.error('Failed to cleanup old operations:', error);
      }
    };

    // Cleanup on mount and then every hour
    cleanup();
    const interval = setInterval(cleanup, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [persistenceManager]);

  const value: QueuePersistenceContextType = {
    isInitialized,
    isHydrated,
    stats,
  };

  return (
    <QueuePersistenceContext.Provider value={value}>
      {children}
    </QueuePersistenceContext.Provider>
  );
}

export function useQueuePersistenceContext(): QueuePersistenceContextType {
  const context = useContext(QueuePersistenceContext);
  if (!context) {
    throw new Error('useQueuePersistenceContext must be used within a QueuePersistenceProvider');
  }
  return context;
}

// Development-only queue persistence debugger
export function QueuePersistenceDebugger() {
  const { isInitialized, isHydrated, stats } = useQueuePersistenceContext();
  const { clearPersistedData } = usePlayerStore();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleClearData = async () => {
    if (confirm('Clear all persisted queue data?')) {
      await clearPersistedData();
      window.location.reload();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <details className="bg-black/90 border border-white/20 rounded-lg p-3 text-xs text-white">
        <summary className="cursor-pointer font-medium text-purple-300 mb-2">
          Queue Persistence Debug
        </summary>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/60">Initialized:</span>
              <div className={`font-medium ${isInitialized ? 'text-green-400' : 'text-yellow-400'}`}>
                {isInitialized ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <span className="text-white/60">Hydrated:</span>
              <div className={`font-medium ${isHydrated ? 'text-green-400' : 'text-yellow-400'}`}>
                {isHydrated ? 'Yes' : 'No'}
              </div>
            </div>
            
            {stats && (
              <>
                <div>
                  <span className="text-white/60">Storage:</span>
                  <div className="font-medium text-blue-400">{stats.storageInfo?.type}</div>
                </div>
                <div>
                  <span className="text-white/60">Items:</span>
                  <div className="font-medium text-purple-400">{stats.storageInfo?.itemCount}</div>
                </div>
                <div>
                  <span className="text-white/60">Queue Age:</span>
                  <div className="font-medium text-teal-400">
                    {stats.queueAge ? Math.round(stats.queueAge / 1000 / 60) + 'm' : 'N/A'}
                  </div>
                </div>
                <div>
                  <span className="text-white/60">Tracks:</span>
                  <div className="font-medium text-orange-400">{stats.trackCount}</div>
                </div>
              </>
            )}
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleClearData}
              className="w-full text-xs bg-red-600/20 hover:bg-red-600/30 text-red-300 px-2 py-1 rounded transition-colors"
            >
              Clear Persisted Data
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
