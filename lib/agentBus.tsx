"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { agentBus, AgentBus } from '@/lib/agents/AgentBus';

interface AgentBusContextType {
  agentBus: AgentBus;
  isInitialized: boolean;
  metrics: any;
}

const AgentBusContext = createContext<AgentBusContextType | null>(null);

interface AgentBusProviderProps {
  children: React.ReactNode;
}

export function AgentBusProvider({ children }: AgentBusProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Initialize agent bus
    setIsInitialized(true);
    console.log('Agent bus initialized');

    // Update metrics periodically
    const metricsInterval = setInterval(() => {
      setMetrics(agentBus.getMetrics());
    }, 10000); // Update every 10 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(metricsInterval);
      agentBus.shutdown();
    };
  }, []);

  const value: AgentBusContextType = {
    agentBus,
    isInitialized,
    metrics,
  };

  return (
    <AgentBusContext.Provider value={value}>
      {children}
    </AgentBusContext.Provider>
  );
}

export function useAgentBus(): AgentBusContextType {
  const context = useContext(AgentBusContext);
  if (!context) {
    throw new Error('useAgentBus must be used within an AgentBusProvider');
  }
  return context;
}

// Re-export the singleton instance
export { agentBus };
