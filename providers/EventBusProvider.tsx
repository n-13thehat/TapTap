"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { eventBus } from '@/lib/eventBus';
import { eventHandlers } from '@/lib/eventHandlers';

interface EventBusContextType {
  isInitialized: boolean;
  metrics: any;
}

const EventBusContext = createContext<EventBusContextType | null>(null);

interface EventBusProviderProps {
  children: React.ReactNode;
}

export function EventBusProvider({ children }: EventBusProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Register all event handlers
    const unsubscribeFunctions = eventHandlers.map(handler => {
      return eventBus.on(handler);
    });

    setIsInitialized(true);
    console.log(`Event bus initialized with ${eventHandlers.length} handlers`);

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(eventBus.getMetrics());
    }, 10000); // Update every 10 seconds

    // Cleanup on unmount
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
      clearInterval(metricsInterval);
      eventBus.shutdown();
    };
  }, []);

  const value: EventBusContextType = {
    isInitialized,
    metrics,
  };

  return (
    <EventBusContext.Provider value={value}>
      {children}
    </EventBusContext.Provider>
  );
}

export function useEventBusContext(): EventBusContextType {
  const context = useContext(EventBusContext);
  if (!context) {
    throw new Error('useEventBusContext must be used within an EventBusProvider');
  }
  return context;
}

// Development-only event bus debugger component
export function EventBusDebugger() {
  const { metrics, isInitialized } = useEventBusContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-sm">
      <details className="bg-black/90 border border-white/20 rounded-lg p-3 text-xs text-white">
        <summary className="cursor-pointer font-medium text-blue-300 mb-2">
          Event Bus Debug ({isInitialized ? 'Active' : 'Inactive'})
        </summary>
        
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/60">Emitted:</span>
              <div className="font-medium text-green-400">{metrics.eventsEmitted || 0}</div>
            </div>
            <div>
              <span className="text-white/60">Processed:</span>
              <div className="font-medium text-blue-400">{metrics.eventsProcessed || 0}</div>
            </div>
            <div>
              <span className="text-white/60">Retried:</span>
              <div className="font-medium text-yellow-400">{metrics.eventsRetried || 0}</div>
            </div>
            <div>
              <span className="text-white/60">Failed:</span>
              <div className="font-medium text-red-400">{metrics.eventsFailed || 0}</div>
            </div>
            <div>
              <span className="text-white/60">Queue:</span>
              <div className="font-medium text-purple-400">{metrics.queueSize || 0}</div>
            </div>
            <div>
              <span className="text-white/60">Handlers:</span>
              <div className="font-medium text-teal-400">{metrics.handlersCount || 0}</div>
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/10">
            <div className="text-white/60 text-xs">
              Status: {isInitialized ? (
                <span className="text-green-400">Initialized</span>
              ) : (
                <span className="text-yellow-400">Initializing...</span>
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
