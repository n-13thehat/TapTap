import { useState, useEffect } from 'react';
import { Agent } from '../types';
import { apiClient } from '../services/api';

export function useAgent(agentId: string | undefined) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (agentId) {
      loadAgent(agentId);
    }
  }, [agentId]);

  async function loadAgent(id: string) {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAgent(id);
      setAgent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent');
    } finally {
      setLoading(false);
    }
  }

  return { agent, loading, error };
}

