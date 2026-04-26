import { ReactNode } from 'react';

// Placeholder provider - agents are loaded per-screen
export function AgentProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

